import { encode } from 'plantuml-encoder';
import { DiagramType, PlantUMLError } from './types';

/**
 * Encode PlantUML text to URL-safe format
 */
export function encodePlantUML(plantumlText: string): string {
  try {
    return encode(plantumlText);
  } catch {
    throw new PlantUMLError('Failed to encode PlantUML text', 'ENCODE_ERROR');
  }
}

/**
 * Generate PlantUML URL for web service rendering
 */
export function generatePlantUMLUrl(plantumlText: string, format: 'svg' | 'png' = 'svg'): string {
  const encoded = encodePlantUML(plantumlText);
  return `https://www.plantuml.com/plantuml/${format}/${encoded}`;
}

/**
 * Render PlantUML using web service (fallback when local rendering is not available)
 */
export async function renderPlantUMLWeb(
  plantumlText: string, 
  format: 'svg' | 'png' = 'svg'
): Promise<string> {
  try {
    const url = generatePlantUMLUrl(plantumlText, format);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new PlantUMLError(`Failed to render diagram: ${response.status}`, 'RENDER_ERROR');
    }

    if (format === 'svg') {
      return await response.text();
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return base64;
    }
  } catch (error) {
    if (error instanceof PlantUMLError) {
      throw error;
    }
    throw new PlantUMLError('Failed to render PlantUML diagram', 'NETWORK_ERROR');
  }
}

/**
 * Enhanced PlantUML validation with detailed error reporting for AI feedback
 * Also includes rendering validation
 */
export function validatePlantUMLForAI(plantumlText: string, diagramType?: DiagramType): { 
  valid: boolean; 
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Basic validation
  if (!plantumlText.trim()) {
    errors.push('PlantUML text cannot be empty');
    suggestions.push('Generate a complete PlantUML diagram starting with @startuml and ending with @enduml');
    return { valid: false, errors, suggestions };
  }

  // Check for @startuml and @enduml
  const hasStart = plantumlText.includes('@startuml');
  const hasEnd = plantumlText.includes('@enduml');
  
  if (!hasStart) {
    errors.push('Missing @startuml directive');
    suggestions.push('Start your PlantUML code with @startuml');
  }
  if (!hasEnd) {
    errors.push('Missing @enduml directive');
    suggestions.push('End your PlantUML code with @enduml');
  }
  
  // Check order of start/end tags
  if (hasStart && hasEnd) {
    const startIndex = plantumlText.indexOf('@startuml');
    const endIndex = plantumlText.indexOf('@enduml');
    if (startIndex >= endIndex) {
      errors.push('@startuml must come before @enduml');
      suggestions.push('Place @startuml at the beginning and @enduml at the end');
    }
  }

  // Check for balanced brackets and parentheses
  const balanceResult = checkBalancedBrackets(plantumlText);
  if (!balanceResult.valid) {
    errors.push(...balanceResult.errors);
    suggestions.push(...balanceResult.suggestions);
  }

  // Check for string termination
  const stringResult = checkStringTermination(plantumlText);
  if (!stringResult.valid) {
    errors.push(...stringResult.errors);
    suggestions.push(...stringResult.suggestions);
  }

  // Check for common PlantUML syntax errors
  const syntaxResult = checkCommonSyntaxErrors(plantumlText);
  if (!syntaxResult.valid) {
    errors.push(...syntaxResult.errors);
    suggestions.push(...syntaxResult.suggestions);
  }

  // Advanced validation checks
  const advancedResult = checkAdvancedSyntaxErrors(plantumlText);
  if (!advancedResult.valid) {
    errors.push(...advancedResult.errors);
    suggestions.push(...advancedResult.suggestions);
  }

  // Diagram-type specific validation
  if (diagramType) {
    const typeResult = validateDiagramTypeSpecificSyntax(plantumlText, diagramType);
    if (!typeResult.valid) {
      errors.push(...typeResult.errors);
      suggestions.push(...typeResult.suggestions);
    }
  }

  return { 
    valid: errors.length === 0, 
    errors, 
    suggestions 
  };
}

/**
 * Validate PlantUML by actually attempting to render it
 */
export async function validatePlantUMLByRendering(plantumlText: string): Promise<{
  valid: boolean;
  errors: string[];
  suggestions: string[];
}> {
  try {
    // Try to render as SVG to validate
    await renderPlantUMLWeb(plantumlText, 'svg');
    return { valid: true, errors: [], suggestions: [] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Parse common PlantUML rendering errors and provide specific suggestions
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    if (errorMessage.includes('400')) {
      errors.push('PlantUML server rejected the diagram syntax');
      suggestions.push('Check for syntax errors, invalid keywords, or malformed diagram structure');
    }
    
    if (errorMessage.includes('syntax') || errorMessage.includes('Syntax')) {
      errors.push('Syntax error in PlantUML code');
      suggestions.push('Review PlantUML syntax documentation for the specific diagram type');
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      errors.push('PlantUML rendering timeout - diagram too complex');
      suggestions.push('Simplify the diagram by reducing the number of elements or relationships');
    }
    
    if (errors.length === 0) {
      errors.push(`PlantUML rendering failed: ${errorMessage}`);
      suggestions.push('Review the entire PlantUML code for syntax errors or invalid constructs');
    }
    
    return { valid: false, errors, suggestions };
  }
}

/**
 * Check balanced brackets, parentheses, and braces
 */
function checkBalancedBrackets(text: string): { valid: boolean; errors: string[]; suggestions: string[] } {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const brackets = { '(': ')', '[': ']', '{': '}' };
  const stack: { char: string; line: number }[] = [];
  
  const lines = text.split('\n');
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char in brackets) {
        stack.push({ char, line: lineNum + 1 });
      } else if (Object.values(brackets).includes(char)) {
        const last = stack.pop();
        if (!last || brackets[last.char as keyof typeof brackets] !== char) {
          errors.push(`Unmatched '${char}' on line ${lineNum + 1}`);
          suggestions.push(`Check that all brackets and parentheses are properly matched on line ${lineNum + 1}`);
          break;
        }
      }
    }
  }
  
  if (stack.length > 0) {
    const unclosed = stack.map(item => `'${item.char}' on line ${item.line}`).join(', ');
    errors.push(`Unclosed brackets/parentheses: ${unclosed}`);
    suggestions.push('Close all opened brackets and parentheses');
  }

  return { valid: errors.length === 0, errors, suggestions };
}

/**
 * Check string termination
 */
function checkStringTermination(text: string): { valid: boolean; errors: string[]; suggestions: string[] } {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Check for unmatched double quotes
  const lines = text.split('\n');
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum].trim();
    if (line.startsWith('\'') || line.startsWith('/\'')) continue; // Skip comments
    
    const quotes = (line.match(/"/g) || []).length;
    if (quotes % 2 !== 0) {
      errors.push(`Unterminated string on line ${lineNum + 1}: ${line}`);
      suggestions.push(`Close all string quotes on line ${lineNum + 1}`);
    }
  }

  return { valid: errors.length === 0, errors, suggestions };
}

/**
 * Validate diagram type specific syntax
 */
function validateDiagramTypeSpecificSyntax(text: string, diagramType: DiagramType): { 
  valid: boolean; 
  errors: string[]; 
  suggestions: string[] 
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const lowerText = text.toLowerCase();
  
  switch (diagramType) {
    case 'component':
      if (!lowerText.includes('[') || !lowerText.includes(']')) {
        errors.push('Component diagram missing [Component] syntax');
        suggestions.push('Use [Component Name] syntax for components, e.g., [User Interface], [Database]');
      }
      break;
      
    case 'class':
      if (!lowerText.includes('class ') || !lowerText.includes('{')) {
        errors.push('Class diagram missing proper class syntax');
        suggestions.push('Use "class ClassName { }" syntax with attributes and methods inside braces');
      }
      break;
      
    case 'sequence':
      if (!lowerText.includes('participant') && !lowerText.includes('actor')) {
        errors.push('Sequence diagram missing participants or actors');
        suggestions.push('Define participants using "participant Name" or "actor Name" syntax');
      }
      if (!lowerText.includes('->') && !lowerText.includes('->>')) {
        errors.push('Sequence diagram missing message arrows');
        suggestions.push('Use "->" for synchronous or "->>" for asynchronous messages');
      }
      break;
      
    case 'usecase':
      if (!lowerText.includes('actor')) {
        errors.push('Use case diagram missing actors');
        suggestions.push('Define actors using "actor ActorName" syntax');
      }
      if (!lowerText.includes('(') || !lowerText.includes(')')) {
        errors.push('Use case diagram missing use case syntax');
        suggestions.push('Define use cases using "(Use Case Name)" syntax');
      }
      break;
      
    case 'activity':
      if (!lowerText.includes(':') || !lowerText.includes(';')) {
        errors.push('Activity diagram missing activity syntax');
        suggestions.push('Define activities using ":activity name;" syntax');
      }
      if (!lowerText.includes('start') && !lowerText.includes('[*]')) {
        errors.push('Activity diagram missing start point');
        suggestions.push('Add "start" or "[*]" to indicate the beginning of the activity flow');
      }
      break;
      
    case 'state':
      if (!lowerText.includes('state') && !lowerText.includes('[*]')) {
        errors.push('State diagram missing state syntax');
        suggestions.push('Use "state StateName" syntax or "[*]" for start/end states');
      }
      break;
      
    case 'deployment':
      if (!lowerText.includes('node')) {
        errors.push('Deployment diagram missing node syntax');
        suggestions.push('Use "node \\"Node Name\\" { }" syntax for deployment nodes');
      }
      break;
  }

  return { valid: errors.length === 0, errors, suggestions };
}

/**
 * Check for common PlantUML syntax errors
 */
function checkCommonSyntaxErrors(text: string): { valid: boolean; errors: string[]; suggestions: string[] } {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const lines = text.split('\n');
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum].trim();
    if (!line || line.startsWith('\'') || line.startsWith('/\'')) continue;
    
    // Check for invalid arrow syntax
    if (line.includes('---') && !line.includes('-->') && !line.includes('--')) {
      errors.push(`Invalid arrow syntax on line ${lineNum + 1}: ${line}`);
      suggestions.push('Use "-->" for relationships, not "---"');
    }
    
    // Check for missing colons in labels
    if (line.includes('->') && line.includes(':') && !line.match(/.*?->.*?:.*$/)) {
      errors.push(`Malformed message syntax on line ${lineNum + 1}: ${line}`);
      suggestions.push('Use format: "A -> B : message" for labeled arrows');
    }
  }

  return { valid: errors.length === 0, errors, suggestions };
}

/**
 * Advanced syntax error checking for PlantUML
 */
function checkAdvancedSyntaxErrors(text: string): { valid: boolean; errors: string[]; suggestions: string[] } {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const lines = text.split('\n');
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum].trim();
    if (!line || line.startsWith('\'') || line.startsWith('/\'')) continue;
    
    // Check for unmatched quotes within lines
    const singleQuotes = (line.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0 && !line.startsWith('\'')) {
      errors.push(`Unmatched single quote on line ${lineNum + 1}: ${line}`);
      suggestions.push(`Close all single quotes on line ${lineNum + 1}`);
    }
    
    // Check for invalid component syntax
    if (line.includes('[') && !line.includes(']')) {
      errors.push(`Unclosed component bracket on line ${lineNum + 1}: ${line}`);
      suggestions.push('Close component brackets with ]');
    }
    
    // Check for invalid use case syntax
    if (line.includes('(') && line.includes('use') && !line.includes(')')) {
      errors.push(`Unclosed use case parenthesis on line ${lineNum + 1}: ${line}`);
      suggestions.push('Close use case parentheses with )');
    }
    
    // Check for invalid class syntax
    if (line.includes('class ') && line.includes('{') && !text.includes('}')) {
      errors.push(`Class definition missing closing brace: ${line}`);
      suggestions.push('Close class definitions with }');
    }
    
    // Check for invalid participant/actor syntax
    if ((line.includes('participant') || line.includes('actor')) && line.includes('"') && (line.match(/"/g) || []).length % 2 !== 0) {
      errors.push(`Unclosed quotes in participant/actor definition on line ${lineNum + 1}: ${line}`);
      suggestions.push('Close all quotes in participant/actor names');
    }
    
    // Check for invalid arrow combinations
    if (line.includes('-->') && line.includes('<--')) {
      errors.push(`Invalid bidirectional arrow syntax on line ${lineNum + 1}: ${line}`);
      suggestions.push('Use separate lines for bidirectional relationships');
    }
    
    // Check for missing spaces around arrows
    if (line.match(/\w(->|-->)\w/) || line.match(/\w(<-|<--)\w/)) {
      errors.push(`Missing spaces around arrows on line ${lineNum + 1}: ${line}`);
      suggestions.push('Add spaces around arrows: "A -> B" not "A->B"');
    }
  }

  return { valid: errors.length === 0, errors, suggestions };
}

/**
 * Simple validation function (kept for backward compatibility)
 */
export function validatePlantUML(plantumlText: string): { valid: boolean; errors: string[] } {
  const result = validatePlantUMLForAI(plantumlText);
  return { 
    valid: result.valid, 
    errors: result.errors 
  };
}

/**
 * Generate basic PlantUML template based on diagram type
 */
export function generatePlantUMLTemplate(type: DiagramType): string {
  switch (type) {
    case 'component':
      return `@startuml
!define RECTANGLE class

package "System" {
  [Component A] as CompA
  [Component B] as CompB
  [Component C] as CompC
  
  CompA --> CompB : uses
  CompB --> CompC : depends on
}

@enduml`;

    case 'deployment':
      return `@startuml
node "Web Server" {
  [Web Application] as webapp
}

node "Database Server" {
  database "MySQL" as db
}

node "Cache Server" {
  [Redis] as cache
}

webapp --> db : queries
webapp --> cache : stores/retrieves

@enduml`;

    case 'class':
      return `@startuml
class User {
  -id: string
  -name: string
  -email: string
  +getName(): string
  +setEmail(email: string): void
}

class Order {
  -id: string
  -userId: string
  -items: Item[]
  +addItem(item: Item): void
  +calculateTotal(): number
}

User ||--o{ Order : places

@enduml`;

    case 'sequence':
      return `@startuml
actor User
participant "Web App" as WA
participant "API" as API
participant "Database" as DB

User -> WA: Request
WA -> API: API Call
API -> DB: Query
DB --> API: Result
API --> WA: Response
WA --> User: Display

@enduml`;

    case 'usecase':
      return `@startuml
left to right direction
actor User
actor Admin

rectangle System {
  User --> (Login)
  User --> (View Data)
  User --> (Edit Profile)
  
  Admin --> (Manage Users)
  Admin --> (System Configuration)
  Admin --> (View Reports)
}

@enduml`;

    case 'activity':
      return `@startuml
start
:User Login;
if (Valid Credentials?) then (yes)
  :Load Dashboard;
  :Display User Data;
else (no)
  :Show Error Message;
  :Return to Login;
endif
stop

@enduml`;

    case 'state':
      return `@startuml
[*] --> Idle
Idle --> Processing : start
Processing --> Completed : success
Processing --> Failed : error
Completed --> [*]
Failed --> Idle : retry

@enduml`;

    default:
      return `@startuml
!theme plain

title Simple Diagram

A --> B : relationship
B --> C : another relationship

@enduml`;
  }
}

/**
 * Extract diagram type from PlantUML content
 */
export function detectDiagramType(plantumlText: string): DiagramType {
  const text = plantumlText.toLowerCase();
  
  if (text.includes('component') || text.includes('package') || text.includes('[') && text.includes(']')) {
    return 'component';
  }
  if (text.includes('node') || text.includes('deployment') || text.includes('server')) {
    return 'deployment';
  }
  if (text.includes('class') || text.includes('interface') || text.includes('abstract')) {
    return 'class';
  }
  if (text.includes('actor') || text.includes('participant') || text.includes('->') || text.includes('-->')) {
    return 'sequence';
  }
  if (text.includes('usecase') || text.includes('actor') && text.includes('(') && text.includes(')')) {
    return 'usecase';
  }
  if (text.includes('start') || text.includes('stop') || text.includes('if') || text.includes('endif')) {
    return 'activity';
  }
  if (text.includes('[*]') || text.includes('state')) {
    return 'state';
  }
  
  return 'component'; // Default fallback
}

/**
 * Clean and format PlantUML text
 */
export function formatPlantUML(plantumlText: string): string {
  return plantumlText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Add theme and styling to PlantUML
 */
export function addPlantUMLStyling(plantumlText: string, theme: string = 'plain'): string {
  if (plantumlText.includes('!theme')) {
    return plantumlText;
  }
  
  const lines = plantumlText.split('\n');
  const startIndex = lines.findIndex(line => line.includes('@startuml'));
  
  if (startIndex !== -1) {
    lines.splice(startIndex + 1, 0, `!theme ${theme}`);
  }
  
  return lines.join('\n');
}
