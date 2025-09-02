import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { DiagramType, AIError } from './types';
import { validatePlantUML, renderPlantUMLWeb } from './plantuml';

const MAX_RETRIES = 2;

// Zod schemas for structured AI responses
const DiagramGenerationSchema = z.object({
  description: z.string().describe('Detailed architecture explanation in markdown format with headings, bullet points, bold, italic etc'),
  plantuml: z.string().describe('Valid PlantUML code starting with @startuml and ending with @enduml'),
  diagramType: z.enum(['component', 'deployment', 'class', 'sequence', 'usecase', 'activity', 'state']).describe('Type of diagram generated')
});

const DiagramEditSchema = z.object({
  plantuml: z.string().describe('Modified PlantUML code with requested changes'),
  changes: z.string().describe('Summary of changes made to the diagram')
});

/**
 * Generate architecture description and PlantUML code from user input with auto-retry
 */
export async function generateDiagram(
  description: string,
  diagramType: DiagramType = 'component'
): Promise<{ description: string; plantuml: string; diagramType: DiagramType }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Validate environment variable
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new AIError('Google Generative AI API key is missing', 'google');
      }

      const model = google('gemini-2.5-flash');
      
      const prompt = createGeneratePrompt(description, diagramType, attempt, lastError);
      
      console.log('Generating diagram with structured response...');
      const result = await generateObject({
        model,
        schema: DiagramGenerationSchema,
        prompt,
        temperature: 0.7,
      });

      // Extract the validated and typed response
      const { description: archDescription, plantuml, diagramType: responseDiagramType } = result.object;
      
      console.log('Generated PlantUML:', plantuml);
      
      // Validate the generated PlantUML
      const validation = validatePlantUML(plantuml);
      if (!validation.valid) {
        console.log('PlantUML validation failed:', validation.errors);
        throw new AIError(`Invalid PlantUML generated: ${validation.errors.join(', ')}`, 'google');
      }

      // Test if the PlantUML can be rendered (quick validation)
      try {
        console.log('Testing PlantUML rendering...');
        await renderPlantUMLWeb(plantuml, 'svg');
        console.log('PlantUML rendering successful');
      } catch (renderError) {
        console.log('PlantUML rendering failed:', renderError);
        throw new AIError(`PlantUML rendering failed: ${renderError}`, 'google');
      }
      
      return {
        description: archDescription,
        plantuml,
        diagramType: responseDiagramType || diagramType
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's not a PlantUML validation error, don't retry
      if (error instanceof AIError && !error.message.includes('Invalid PlantUML') && !error.message.includes('PlantUML rendering failed')) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRIES) {
        console.error(`Failed to generate valid PlantUML after ${MAX_RETRIES} attempts:`, lastError);
        throw new AIError(
          `Failed to generate valid PlantUML after ${MAX_RETRIES} attempts. Last error: ${lastError.message}`, 
          'google'
        );
      }
      
      console.warn(`Attempt ${attempt} failed, retrying... Error: ${lastError.message}`);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new AIError('Unexpected error in retry loop', 'google');
}

/**
 * Edit existing PlantUML code based on natural language instructions with auto-retry
 */
export async function editDiagram(
  existingPlantUML: string,
  editInstructions: string
): Promise<{ plantuml: string; changes: string[] }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Validate environment variable
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new AIError('Google Generative AI API key is missing', 'google');
      }

      const model = google('gemini-1.5-flash');
      
      const prompt = createEditPrompt(existingPlantUML, editInstructions, attempt, lastError);
      
      console.log('Editing diagram with structured response...');
      const result = await generateObject({
        model,
        schema: DiagramEditSchema,
        prompt,
        temperature: 0.5,
      });

      // Extract the validated and typed response
      const { plantuml, changes } = result.object;
      
      // Validate the edited PlantUML
      const validation = validatePlantUML(plantuml);
      if (!validation.valid) {
        throw new AIError(`Invalid PlantUML generated: ${validation.errors.join(', ')}`, 'google');
      }

      // Test if the PlantUML can be rendered (quick validation)
      try {
        await renderPlantUMLWeb(plantuml, 'svg');
      } catch (renderError) {
        throw new AIError(`PlantUML rendering failed: ${renderError}`, 'google');
      }
      
      return {
        plantuml,
        changes: [changes] // Convert string to array for backwards compatibility
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's not a PlantUML validation error, don't retry
      if (error instanceof AIError && !error.message.includes('Invalid PlantUML') && !error.message.includes('PlantUML rendering failed')) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRIES) {
        console.error(`Failed to edit PlantUML after ${MAX_RETRIES} attempts:`, lastError);
        throw new AIError(
          `Failed to generate valid PlantUML after ${MAX_RETRIES} attempts. Last error: ${lastError.message}`, 
          'google'
        );
      }

      // Wait a bit before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      
      console.warn(`Edit attempt ${attempt} failed, retrying... Error: ${lastError.message}`);
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
  lastError: Error | null = null
): string {
  let retryContext = '';
  
  if (attempt > 1 && lastError) {
    retryContext = `

IMPORTANT: This is retry attempt ${attempt}/${MAX_RETRIES}. 
Previous attempt failed with error: ${lastError.message}

Please pay extra attention to:
1. PlantUML syntax correctness - ensure all brackets, parentheses, and braces are properly matched
2. Valid PlantUML keywords and structure
3. Proper @startuml and @enduml tags
4. No syntax errors that would prevent rendering
5. Follow PlantUML ${diagramType} diagram conventions strictly
6. CRITICAL: Ensure all strings are properly quoted and terminated
7. Avoid unmatched quotes or complex string handling
8. Use simple, clear component and relationship names without special characters`;
  }

  return `You are an expert software architect. Based on the following description, create a detailed architecture explanation and generate PlantUML code.

Description: ${description} 
Create a comprehensive markdown description with headings, bullet points, bold, italic etc where appropriate.${retryContext}

Instructions:
1. Create a ${diagramType} diagram.
2. Provide a clear, detailed explanation of the architecture
3. Generate clean, well-structured PlantUML code
4. Use appropriate PlantUML syntax and best practices
5. Include meaningful names and relationships
6. Add comments where helpful
7. CRITICAL: Ensure the PlantUML code is syntactically correct and can be rendered without errors
8. SYNTAX REQUIREMENTS: 
   - Use simple, clear component names without special characters
   - Ensure all strings are properly quoted and terminated
   - Avoid complex string handling or multi-line strings
   - Use basic PlantUML syntax only - NO !theme, NO skinparam, NO advanced styling
9. DESIGN REQUIREMENTS: Create a clean diagram with:
   - Use clear, readable component names
   - Implement proper visual hierarchy
   - Use proper grouping and layout for clarity
   - Keep styling simple and focus on structure over appearance
   ${diagramType === 'usecase' ? '- IMPORTANT: Always use horizontal layout for use case diagrams (left to right) to improve readability and flow' : ''}

Ensure the PlantUML code is syntactically correct and follows PlantUML conventions.`;
}

/**
 * Create prompt for editing existing diagrams with retry context
 */
function createEditPrompt(
  existingPlantUML: string, 
  editInstructions: string, 
  attempt: number = 1, 
  lastError: Error | null = null
): string {
  let retryContext = '';
  
  if (attempt > 1 && lastError) {
    retryContext = `

IMPORTANT: This is retry attempt ${attempt}/${MAX_RETRIES}. 
Previous attempt failed with error: ${lastError.message}

Please pay extra attention to:
1. PlantUML syntax correctness - ensure all brackets, parentheses, and braces are properly matched
2. Valid PlantUML keywords and structure
3. Proper @startuml and @enduml tags
4. No syntax errors that would prevent rendering
5. Maintain the existing diagram structure while applying changes
6. Test your syntax mentally before responding`;
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
