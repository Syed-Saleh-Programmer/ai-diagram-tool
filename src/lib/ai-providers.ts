import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { DiagramType, AIError } from './types';

/**
 * Generate architecture description and PlantUML code from user input
 */
export async function generateDiagram(
  description: string,
  diagramType: DiagramType = 'component'
): Promise<{ description: string; plantuml: string; diagramType: DiagramType }> {
  try {
    // Validate environment variable
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new AIError('Google Generative AI API key is missing', 'google');
    }

    const model = google('gemini-1.5-flash');
    
    const prompt = createGeneratePrompt(description, diagramType);
    
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.7,
    });

    const result = parseGenerateResponse(text);
    
    return {
      description: result.description,
      plantuml: result.plantuml,
      diagramType: result.diagramType || detectDiagramTypeFromDescription(description)
    };
    
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }
    throw new AIError(`Failed to generate diagram: ${error}`, 'google');
  }
}

/**
 * Edit existing PlantUML code based on natural language instructions
 */
export async function editDiagram(
  existingPlantUML: string,
  editInstructions: string
): Promise<{ plantuml: string; changes: string[] }> {
  try {
    // Validate environment variable
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new AIError('Google Generative AI API key is missing', 'google');
    }

    const model = google('gemini-1.5-flash');
    
    const prompt = createEditPrompt(existingPlantUML, editInstructions);
    
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.5,
    });

    const result = parseEditResponse(text);
    
    return {
      plantuml: result.plantuml,
      changes: result.changes
    };
    
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }
    throw new AIError(`Failed to edit diagram: ${error}`, 'google');
  }
}

/**
 * Create prompt for generating new diagrams
 */
function createGeneratePrompt(description: string, diagramType: DiagramType): string {
  return `You are an expert software architect. Based on the following description, create a detailed architecture explanation and generate PlantUML code.

Description: ${description}

Instructions:
1. Create a ${diagramType} diagram.
2. Provide a clear, detailed explanation of the architecture
3. Generate clean, well-structured PlantUML code
4. Use appropriate PlantUML syntax and best practices
5. Include meaningful names and relationships
6. Add comments where helpful

Format your response as JSON:
{
  "description": "Detailed architecture explanation",
  "plantuml": "Complete PlantUML code starting with @startuml and ending with @enduml",
  "diagramType": "component|deployment|class|sequence|usecase|activity|state"
}

Ensure the PlantUML code is syntactically correct and follows PlantUML conventions.`;
}

/**
 * Create prompt for editing existing diagrams
 */
function createEditPrompt(existingPlantUML: string, editInstructions: string): string {
  return `You are an expert software architect. Modify the following PlantUML diagram based on the edit instructions.

Current PlantUML code:
${existingPlantUML}

Edit instructions: ${editInstructions}

Instructions:
1. Carefully analyze the existing PlantUML code
2. Apply the requested changes while maintaining the diagram's integrity
3. Preserve existing elements unless specifically asked to remove them
4. Ensure the modified code is syntactically correct
5. List the specific changes made

Format your response as JSON:
{
  "plantuml": "Modified PlantUML code starting with @startuml and ending with @enduml",
  "changes": ["List of specific changes made", "Each change as a separate string"]
}

Ensure the modified PlantUML code is syntactically correct and follows PlantUML conventions.`;
}

/**
 * Parse the AI response for diagram generation
 */
function parseGenerateResponse(response: string): {
  description: string;
  plantuml: string;
  diagramType: DiagramType;
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.description || !parsed.plantuml) {
      throw new Error('Missing required fields in response');
    }
    
    return {
      description: parsed.description,
      plantuml: parsed.plantuml,
      diagramType: parsed.diagramType || 'component'
    };
  } catch {
    // Fallback parsing for non-JSON responses
    const lines = response.split('\n');
    let plantuml = '';
    let description = '';
    let inPlantUML = false;
    
    for (const line of lines) {
      if (line.includes('@startuml')) {
        inPlantUML = true;
      }
      
      if (inPlantUML) {
        plantuml += line + '\n';
      } else if (line.trim() && !line.includes('{') && !line.includes('}')) {
        description += line + ' ';
      }
      
      if (line.includes('@enduml')) {
        inPlantUML = false;
      }
    }
    
    if (!plantuml || !description) {
      throw new AIError('Failed to parse AI response', 'google');
    }
    
    return {
      description: description.trim(),
      plantuml: plantuml.trim(),
      diagramType: 'component'
    };
  }
}

/**
 * Parse the AI response for diagram editing
 */
function parseEditResponse(response: string): {
  plantuml: string;
  changes: string[];
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.plantuml) {
      throw new Error('Missing plantuml in response');
    }
    
    return {
      plantuml: parsed.plantuml,
      changes: parsed.changes || ['Diagram updated based on instructions']
    };
  } catch {
    // Fallback parsing
    const lines = response.split('\n');
    let plantuml = '';
    let inPlantUML = false;
    
    for (const line of lines) {
      if (line.includes('@startuml')) {
        inPlantUML = true;
      }
      
      if (inPlantUML) {
        plantuml += line + '\n';
      }
      
      if (line.includes('@enduml')) {
        inPlantUML = false;
      }
    }
    
    if (!plantuml) {
      throw new AIError('Failed to parse edit response', 'google');
    }
    
    return {
      plantuml: plantuml.trim(),
      changes: ['Diagram updated based on instructions']
    };
  }
}

/**
 * Detect diagram type from description text
 */
function detectDiagramTypeFromDescription(description: string): DiagramType {
  const text = description.toLowerCase();
  
  if (text.includes('class') || text.includes('object') || text.includes('inheritance')) {
    return 'class';
  }
  if (text.includes('deploy') || text.includes('server') || text.includes('infrastructure')) {
    return 'deployment';
  }
  if (text.includes('sequence') || text.includes('flow') || text.includes('interaction')) {
    return 'sequence';
  }
  if (text.includes('use case') || text.includes('actor') || text.includes('user story')) {
    return 'usecase';
  }
  if (text.includes('activity') || text.includes('process') || text.includes('workflow')) {
    return 'activity';
  }
  if (text.includes('state') || text.includes('status') || text.includes('lifecycle')) {
    return 'state';
  }
  
  return 'component'; // Default
}
