import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { DiagramType, AIError } from './types';
import { validatePlantUMLForAI, validatePlantUMLByRendering } from './plantuml';

const MAX_RETRIES = 2; // Set back to 2 as requested

// Zod schemas for structured AI responses
const DiagramGenerationSchema = z.object({
  description: z.string().describe('Detailed architecture explanation in markdown format with headings, bullet points, bold, italic etc'),
  plantuml: z.string().describe('Valid PlantUML code that follows the specific syntax for the requested diagram type, starting with @startuml and ending with @enduml'),
  diagramType: z.enum(['component', 'deployment', 'class', 'sequence', 'usecase', 'activity', 'state']).describe('The exact diagram type that was requested and generated')
});

const DiagramEditSchema = z.object({
  plantuml: z.string().describe('Modified PlantUML code with requested changes'),
  changes: z.string().describe('Summary of changes made to the diagram')
});

/**
 * Get diagram type specific instructions for PlantUML generation
 */
function getDiagramTypeSpecificInstructions(diagramType: DiagramType): string {
  switch (diagramType) {
    case 'component':
      return `COMPONENT DIAGRAM REQUIREMENTS:
- MUST use [Component Name] syntax for all components and services
- Use () syntax for interfaces: (Interface Name)
- Use --> for dependencies and connections
- Use ..> for weak dependencies
- Group related components with rectangle/package if needed
- Example structure:
  @startuml
  [User Interface] --> [Business Logic]
  [Business Logic] --> [Data Access]
  [Data Access] --> [Database]
  @enduml`;

    case 'deployment':
      return `DEPLOYMENT DIAGRAM REQUIREMENTS:
- MUST use node "Node Name" syntax for physical nodes/servers
- Use artifact "Artifact Name" syntax for deployable components
- Show deployment relationships with -->
- Include hardware/infrastructure components
- Example structure:
  @startuml
  node "Web Server" {
    [Web Application]
  }
  node "Database Server" {
    [Database]
  }
  [Web Application] --> [Database]
  @enduml`;

    case 'class':
      return `CLASS DIAGRAM REQUIREMENTS:
- MUST use class ClassName { } syntax for all classes
- Include attributes and methods inside braces
- Use + for public, - for private, # for protected, ~ for package
- Use --|> for inheritance, --* for composition, --o for aggregation
- Use --> for simple associations
- Example structure:
  @startuml
  class User {
    +name: String
    +email: String
    +login(): boolean
  }
  class Account {
    -balance: float
    +deposit(amount): void
  }
  User --> Account
  @enduml`;

    case 'sequence':
      return `SEQUENCE DIAGRAM REQUIREMENTS:
- MUST use participant or actor for all entities
- Use -> for synchronous messages, ->> for asynchronous
- Use <-- for return messages
- Show time progression from top to bottom
- Use activate/deactivate for object lifelines if needed
- Example structure:
  @startuml
  participant User
  participant System
  participant Database
  User -> System: login(credentials)
  System -> Database: validate(user)
  Database --> System: result
  System --> User: success/failure
  @enduml`;

    case 'usecase':
      return `USE CASE DIAGRAM REQUIREMENTS:
- MUST use actor for all external entities
- Use (Use Case Name) syntax for all use cases
- Use --> for actor-to-usecase associations
- Use <<include>> and <<extend>> for use case relationships
- Keep layout clear and readable
- layout should be horizontal (left to right). actors in the left and right and usecases in between
- Example structure:
  @startuml
  actor User
  actor Admin
  (Login) as UC1
  (View Dashboard) as UC2
  (Manage Users) as UC3
  User --> UC1
  User --> UC2
  Admin --> UC3
  UC2 .> UC1 : <<include>>
  @enduml`;

    case 'activity':
      return `ACTIVITY DIAGRAM REQUIREMENTS:
- MUST use :activity name; syntax for all activities
- Use start and stop/end for begin and end points
- Use if (condition?) then (yes) else (no) endif for decisions
- Use fork and join for parallel processes
- Show clear workflow progression
- Example structure:
  @startuml
  start
  :Initialize System;
  if (User Authenticated?) then (yes)
    :Load Dashboard;
  else (no)
    :Show Login Form;
    :Validate Credentials;
  endif
  :Display Content;
  stop
  @enduml`;

    case 'state':
      return `STATE DIAGRAM REQUIREMENTS:
- MUST use state "State Name" syntax for all states
- Use [*] for initial and final states
- Use --> for state transitions with trigger labels
- Show clear state changes and conditions
- Include trigger events and conditions
- Example structure:
  @startuml
  [*] --> Idle
  Idle --> Active : start
  Active --> Processing : process
  Processing --> Active : complete
  Active --> Idle : stop
  Processing --> Error : failure
  Error --> Idle : reset
  Idle --> [*]
  @enduml`;

    default:
      return `Create a proper ${diagramType} diagram following PlantUML conventions and best practices.`;
  }
}

/**
 * Generate architecture description and PlantUML code from user input with auto-retry
 */
export async function generateDiagram(
  description: string,
  diagramType: DiagramType = 'component'
): Promise<{ description: string; plantuml: string; diagramType: DiagramType }> {
  let lastError: Error | null = null;
  let lastValidationResult: { errors: string[]; suggestions: string[] } | null = null;
  let lastPlantUMLAttempt: string = '';
  
  console.log(`🚀 Starting diagram generation for type: ${diagramType} (max ${MAX_RETRIES} attempts)`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${MAX_RETRIES}${attempt > 1 ? ' (AUTO-RETRY)' : ''}`);
      
      // Validate environment variable
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new AIError('Google Generative AI API key is missing', 'google');
      }

      const model = google('gemini-2.5-flash-lite');
      
      // Create prompt with validation feedback for retries
      const prompt = createGeneratePrompt(description, diagramType, attempt, lastError, lastValidationResult);
      
      const result = await generateObject({
        model,
        schema: DiagramGenerationSchema,
        prompt,
        temperature: attempt > 1 ? 0.2 : 0.7, // Even lower temperature for retries
      });

      // Extract the validated and typed response
      const { description: archDescription, plantuml, diagramType: responseDiagramType } = result.object;
      lastPlantUMLAttempt = plantuml;
      
      console.log(`✅ AI generated PlantUML (${plantuml.length} chars), validating...`);
      
      // First validate syntax
      const syntaxValidation = validatePlantUMLForAI(plantuml, diagramType);
      
      if (!syntaxValidation.valid) {
        lastValidationResult = syntaxValidation;
        console.warn(`❌ Syntax validation failed on attempt ${attempt}:`);
        console.warn(`   Errors: ${syntaxValidation.errors.join(', ')}`);
        console.warn(`   Suggestions: ${syntaxValidation.suggestions.join(', ')}`);
        
        if (attempt < MAX_RETRIES) {
          console.log(`🔄 Auto-retrying with syntax validation feedback...`);
        }
        
        throw new Error(`PlantUML syntax validation failed: ${syntaxValidation.errors.join(', ')}`);
      }
      
      console.log(`✅ Syntax validation passed, checking rendering...`);
      
      // Then validate by actual rendering
      const renderValidation = await validatePlantUMLByRendering(plantuml);
      
      if (!renderValidation.valid) {
        // Combine syntax validation (which passed) with render validation errors
        lastValidationResult = {
          errors: renderValidation.errors,
          suggestions: [
            ...renderValidation.suggestions,
            'The syntax validation passed, but rendering failed - check for PlantUML server compatibility',
            'Ensure all diagram elements are properly formatted for the PlantUML server'
          ]
        };
        console.warn(`❌ Render validation failed on attempt ${attempt}:`);
        console.warn(`   Errors: ${renderValidation.errors.join(', ')}`);
        console.warn(`   Suggestions: ${renderValidation.suggestions.join(', ')}`);
        
        if (attempt < MAX_RETRIES) {
          console.log(`🔄 Auto-retrying with render validation feedback...`);
        }
        
        throw new Error(`PlantUML render validation failed: ${renderValidation.errors.join(', ')}`);
      }
      
      console.log(`🎉 Both syntax and render validation successful! Generated valid ${diagramType} diagram on attempt ${attempt}`);
      
      return {
        description: archDescription,
        plantuml,
        diagramType: responseDiagramType || diagramType
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a non-retriable error
      if (error instanceof AIError && 
          !error.message.includes('Invalid PlantUML') && 
          !error.message.includes('PlantUML rendering failed') && 
          !error.message.includes('PlantUML validation failed') &&
          !error.message.includes('PlantUML syntax validation failed') &&
          !error.message.includes('PlantUML render validation failed')) {
        console.error(`💥 Non-retriable error: ${error.message}`);
        throw error;
      }

      // If this is the last attempt, throw detailed error
      if (attempt === MAX_RETRIES) {
        console.error(`🚫 All ${MAX_RETRIES} attempts failed. Final error: ${lastError.message}`);
        
        // Create detailed error message with validation context
        let errorMessage = `Failed to generate valid PlantUML after ${MAX_RETRIES} attempts.`;
        
        if (lastValidationResult) {
          errorMessage += `\n\nFinal validation errors:\n${lastValidationResult.errors.map(e => `• ${e}`).join('\n')}`;
          errorMessage += `\n\nSuggested fixes:\n${lastValidationResult.suggestions.map(s => `• ${s}`).join('\n')}`;
        }
        
        if (lastPlantUMLAttempt) {
          errorMessage += `\n\nLast PlantUML attempt:\n${lastPlantUMLAttempt}`;
        }
        
        throw new AIError(errorMessage, 'google');
      }
      
      // Log retry info
      console.warn(`⚠️  Attempt ${attempt} failed: ${lastError.message}`);
      
      // Small delay between retries to avoid rate limiting
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * attempt, 3000); // Max 3 second delay
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new AIError('Unexpected error in retry loop', 'google');
}

/**
 * Edit existing PlantUML code based on natural language instructions with auto-retry
 */
/**
 * Edit existing PlantUML code based on natural language instructions with auto-retry
 */
export async function editDiagram(
  existingPlantUML: string,
  editInstructions: string
): Promise<{ plantuml: string; changes: string[] }> {
  let lastError: Error | null = null;
  let lastValidationResult: { errors: string[]; suggestions: string[] } | null = null;
  let lastPlantUMLAttempt: string = '';
  
  console.log(`🚀 Starting diagram edit (max ${MAX_RETRIES} attempts)`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Edit attempt ${attempt}/${MAX_RETRIES}${attempt > 1 ? ' (AUTO-RETRY)' : ''}`);
      
      // Validate environment variable
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new AIError('Google Generative AI API key is missing', 'google');
      }

      const model = google('gemini-1.5-flash');
      
      // Create prompt with validation feedback for retries
      const prompt = createEditPrompt(existingPlantUML, editInstructions, attempt, lastError, lastValidationResult);
      
      const result = await generateObject({
        model,
        schema: DiagramEditSchema,
        prompt,
        temperature: attempt > 1 ? 0.2 : 0.5, // Even lower temperature for retries
      });

      // Extract the validated and typed response
      const { plantuml, changes } = result.object;
      lastPlantUMLAttempt = plantuml;
      
      console.log(`✅ AI edited PlantUML (${plantuml.length} chars), validating...`);
      
      // First validate syntax
      const syntaxValidation = validatePlantUMLForAI(plantuml);
      
      if (!syntaxValidation.valid) {
        lastValidationResult = syntaxValidation;
        console.warn(`❌ Edit syntax validation failed on attempt ${attempt}:`);
        console.warn(`   Errors: ${syntaxValidation.errors.join(', ')}`);
        console.warn(`   Suggestions: ${syntaxValidation.suggestions.join(', ')}`);
        
        if (attempt < MAX_RETRIES) {
          console.log(`🔄 Auto-retrying edit with syntax validation feedback...`);
        }
        
        throw new Error(`PlantUML syntax validation failed: ${syntaxValidation.errors.join(', ')}`);
      }
      
      console.log(`✅ Edit syntax validation passed, checking rendering...`);
      
      // Then validate by actual rendering
      const renderValidation = await validatePlantUMLByRendering(plantuml);
      
      if (!renderValidation.valid) {
        // Combine syntax validation (which passed) with render validation errors
        lastValidationResult = {
          errors: renderValidation.errors,
          suggestions: [
            ...renderValidation.suggestions,
            'The syntax validation passed, but rendering failed - check for PlantUML server compatibility',
            'Ensure all diagram elements are properly formatted for the PlantUML server'
          ]
        };
        console.warn(`❌ Edit render validation failed on attempt ${attempt}:`);
        console.warn(`   Errors: ${renderValidation.errors.join(', ')}`);
        console.warn(`   Suggestions: ${renderValidation.suggestions.join(', ')}`);
        
        if (attempt < MAX_RETRIES) {
          console.log(`🔄 Auto-retrying edit with render validation feedback...`);
        }
        
        throw new Error(`PlantUML render validation failed: ${renderValidation.errors.join(', ')}`);
      }
      
      console.log(`🎉 Both edit syntax and render validation successful on attempt ${attempt}`);
      
      return {
        plantuml,
        changes: [changes] // Convert string to array for backwards compatibility
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a non-retriable error
      if (error instanceof AIError && !error.message.includes('PlantUML validation failed') &&
          !error.message.includes('PlantUML syntax validation failed') &&
          !error.message.includes('PlantUML render validation failed')) {
        console.error(`💥 Non-retriable edit error: ${error.message}`);
        throw error;
      }

      // If this is the last attempt, throw detailed error
      if (attempt === MAX_RETRIES) {
        console.error(`🚫 All ${MAX_RETRIES} edit attempts failed. Final error: ${lastError.message}`);
        
        // Create detailed error message with validation context
        let errorMessage = `Failed to edit PlantUML after ${MAX_RETRIES} attempts.`;
        
        if (lastValidationResult) {
          errorMessage += `\n\nFinal validation errors:\n${lastValidationResult.errors.map(e => `• ${e}`).join('\n')}`;
          errorMessage += `\n\nSuggested fixes:\n${lastValidationResult.suggestions.map(s => `• ${s}`).join('\n')}`;
        }
        
        if (lastPlantUMLAttempt) {
          errorMessage += `\n\nLast PlantUML attempt:\n${lastPlantUMLAttempt}`;
        }
        
        throw new AIError(errorMessage, 'google');
      }

      // Log retry info
      console.warn(`⚠️  Edit attempt ${attempt} failed: ${lastError.message}`);
      
      // Small delay between retries to avoid rate limiting
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * attempt, 3000); // Max 3 second delay
        console.log(`⏳ Waiting ${delay}ms before edit retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new AIError('Unexpected error in edit retry loop', 'google');
}

/**
 * Create prompt for generating new diagrams with retry context
 */
function createGeneratePrompt(
  description: string, 
  diagramType: DiagramType, 
  attempt: number = 1, 
  lastError: Error | null = null,
  lastValidationResult: { errors: string[]; suggestions: string[] } | null = null
): string {
  let retryContext = '';
  
  if (attempt > 1 && (lastError || lastValidationResult)) {
    retryContext = `

🔄 AUTOMATIC RETRY - ATTEMPT ${attempt}/${MAX_RETRIES}`;

    if (lastValidationResult && lastValidationResult.errors.length > 0) {
      retryContext += `

🚨 YOUR PREVIOUS PlantUML CODE HAD THESE VALIDATION ERRORS:
${lastValidationResult.errors.map((error, index) => `${index + 1}. ❌ ${error}`).join('\n')}

🛠️  TO FIX THESE ERRORS, YOU MUST:
${lastValidationResult.suggestions.map((suggestion, index) => `${index + 1}. ✅ ${suggestion}`).join('\n')}

⚠️  CRITICAL: You MUST address every single error listed above in your new attempt.`;
    }

    if (lastError) {
      retryContext += `

💥 Previous generation error: ${lastError.message}`;
    }

    retryContext += `

🎯 RETRY INSTRUCTIONS - FOLLOW EXACTLY:
1. 🔍 ANALYZE: Review each validation error above carefully
2. 🛠️  IMPLEMENT: Apply every single suggested fix listed above
3. ✅ VERIFY: Ensure your PlantUML code addresses all validation errors
4. 🎨 SYNTAX: Use proper ${diagramType} diagram syntax only
5. 🔗 STRUCTURE: Ensure @startuml and @enduml tags are present
6. 📝 CLARITY: Use simple, clear names without special characters
7. 🔒 VALIDATION: Double-check bracket/parentheses matching
8. 📋 COMPLETION: Generate complete, syntactically correct PlantUML

⭐ SUCCESS CRITERIA: Your PlantUML must pass validation on this attempt!`;
  }

  return `You are an expert software architect and PlantUML specialist. Based on the following description, create a detailed architecture explanation and generate PlantUML code.

Description: ${description} 
Create a comprehensive markdown description with headings, bullet points, bold, italic etc where appropriate.${retryContext}

CRITICAL INSTRUCTIONS:
1. You MUST create a ${diagramType.toUpperCase()} diagram - not any other type!
2. Use ONLY the syntax specific to ${diagramType} diagrams as specified below
3. Follow PlantUML ${diagramType} diagram conventions exactly
4. Provide a clear, detailed explanation of the architecture
5. Generate clean, well-structured PlantUML code that renders correctly

${getDiagramTypeSpecificInstructions(diagramType)}

GENERAL SYNTAX REQUIREMENTS: 
- Always start with @startuml and end with @enduml
- Use simple, clear names without special characters
- Ensure all syntax is valid PlantUML
- Keep the diagram focused and readable
- NO themes, NO skinparam, NO advanced styling

DESIGN REQUIREMENTS:
- Create a clean, professional diagram
- Use clear, readable component/entity names
- Implement proper visual hierarchy
- Show meaningful relationships and flows
- Focus on structure and clarity

Remember: You are creating a ${diagramType.toUpperCase()} diagram. Use the specific syntax and conventions for ${diagramType} diagrams only!`;
}

/**
 * Create prompt for editing existing diagrams with retry context
 */
function createEditPrompt(
  existingPlantUML: string, 
  editInstructions: string, 
  attempt: number = 1, 
  lastError: Error | null = null,
  lastValidationResult: { errors: string[]; suggestions: string[] } | null = null
): string {
  let retryContext = '';
  
  if (attempt > 1 && (lastError || lastValidationResult)) {
    retryContext = `

🔄 AUTOMATIC EDIT RETRY - ATTEMPT ${attempt}/${MAX_RETRIES}`;

    if (lastValidationResult && lastValidationResult.errors.length > 0) {
      retryContext += `

🚨 YOUR PREVIOUS EDITED PlantUML CODE HAD THESE VALIDATION ERRORS:
${lastValidationResult.errors.map((error, index) => `${index + 1}. ❌ ${error}`).join('\n')}

🛠️  TO FIX THESE EDIT ERRORS, YOU MUST:
${lastValidationResult.suggestions.map((suggestion, index) => `${index + 1}. ✅ ${suggestion}`).join('\n')}

⚠️  CRITICAL: You MUST address every single error listed above in your edited code.`;
    }

    if (lastError) {
      retryContext += `

💥 Previous edit error: ${lastError.message}`;
    }

    retryContext += `

🎯 EDIT RETRY INSTRUCTIONS - FOLLOW EXACTLY:
1. 🔍 ANALYZE: Review each validation error above carefully
2. 🛠️  IMPLEMENT: Apply every single suggested fix listed above
3. ✅ VERIFY: Ensure your edited PlantUML code addresses all validation errors
4. 🎨 MAINTAIN: Keep existing diagram structure while applying requested changes
5. 🔗 STRUCTURE: Ensure @startuml and @enduml tags remain intact
6. 📝 CLARITY: Use simple, clear names without special characters
7. 🔒 VALIDATION: Double-check bracket/parentheses matching
8. 📋 COMPLETION: Generate complete, syntactically correct edited PlantUML

⭐ EDIT SUCCESS CRITERIA: Your edited PlantUML must pass validation on this attempt!`;
  }

  return `You are an expert software architect. Modify the following PlantUML diagram based on the edit instructions.

Current PlantUML code:
${existingPlantUML}

Edit instructions: ${editInstructions}${retryContext}

Instructions:
1. Carefully analyze the existing PlantUML code
2. Apply the requested changes while maintaining the diagram's integrity
3. Preserve existing elements unless specifically asked to remove them
4. Ensure the modified code is syntactically correct
5. Provide a clear summary of the specific changes made
6. CRITICAL: Ensure the modified PlantUML code is syntactically correct and can be rendered without errors
7. DESIGN REQUIREMENTS: Maintain or improve the clean design with:
   - Use basic PlantUML syntax only - NO !theme, NO skinparam, NO advanced styling
   - Maintain consistent spacing and alignment
   - Use clear, readable component names
   - Preserve proper visual hierarchy
   - Keep styling simple and focus on structure over appearance
   - Use proper grouping and layout for clarity

Ensure the modified PlantUML code is syntactically correct and follows PlantUML conventions.`;
}
