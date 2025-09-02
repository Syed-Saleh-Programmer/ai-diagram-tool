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
 * Validate PlantUML syntax with enhanced checking
 */
export function validatePlantUML(plantumlText: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation
  if (!plantumlText.trim()) {
    errors.push('PlantUML text cannot be empty');
    return { valid: false, errors };
  }

  // Check for @startuml and @enduml
  const hasStart = plantumlText.includes('@startuml');
  const hasEnd = plantumlText.includes('@enduml');
  
  if (!hasStart) {
    errors.push('PlantUML must start with @startuml');
  }
  if (!hasEnd) {
    errors.push('PlantUML must end with @enduml');
  }
  
  // Check if @startuml comes before @enduml
  if (hasStart && hasEnd) {
    const startIndex = plantumlText.indexOf('@startuml');
    const endIndex = plantumlText.indexOf('@enduml');
    if (startIndex >= endIndex) {
      errors.push('@startuml must come before @enduml');
    }
  }

  // Check for balanced parentheses, brackets, and braces
  const brackets = { '(': ')', '[': ']', '{': '}' };
  const stack: string[] = [];
  
  for (const char of plantumlText) {
    if (char in brackets) {
      stack.push(char);
    } else if (Object.values(brackets).includes(char)) {
      const last = stack.pop();
      if (!last || brackets[last as keyof typeof brackets] !== char) {
        errors.push('Unmatched brackets or parentheses');
        break;
      }
    }
  }
  
  if (stack.length > 0) {
    errors.push('Unclosed brackets or parentheses');
  }

  // Check for common PlantUML syntax errors
  const lines = plantumlText.split('\n').map(line => line.trim());
  
  // Check for unterminated strings across the entire content (not line by line)
  const entireContent = plantumlText.replace(/'/g, ''); // Remove single quotes to focus on double quotes
  const doubleQuotes = (entireContent.match(/"/g) || []).length;
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unterminated string - unmatched double quotes in the entire diagram');
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('\'') || line.startsWith('/\'')) continue; // Skip empty lines and comments
    
    // Check for invalid characters in identifiers
    if (line.includes('-->') || line.includes('->') || line.includes('--')) {
      // Skip PlantUML directional arrows and special syntax
      if (line.includes('--up') || line.includes('--down') || line.includes('--left') || line.includes('--right') ||
          line.includes('-[#') || line.includes(']') || line.includes('--o') || line.includes('--|>')) {
        continue;
      }
      
      // Relationship line - check for proper syntax
      const parts = line.split(/-->|->/).map(p => p.trim());
      for (const part of parts) {
        if (part && part.includes(' ') && !part.includes(':') && !part.includes('"')) {
          // Skip PlantUML color syntax like -[#color] and directional syntax
          if (part.includes('-[#') || part.includes(']') || part.includes('--') || part.includes('#')) continue;
          
          // Might be an unquoted identifier with spaces
          const beforeColon = part.split(':')[0].trim();
          if (beforeColon.includes(' ') && !beforeColon.startsWith('[') && !beforeColon.startsWith('(') && !beforeColon.includes('#')) {
            errors.push(`Line ${i + 1}: Identifier with spaces should be quoted: "${beforeColon}"`);
          }
        }
      }
    }
  }

  // Check for diagram-specific syntax
  const diagramType = detectDiagramType(plantumlText);
  switch (diagramType) {
    case 'sequence':
      if (!plantumlText.includes('actor') && !plantumlText.includes('participant') && !plantumlText.includes('->')) {
        errors.push('Sequence diagram should contain actors/participants and message flows');
      }
      break;
    case 'class':
      if (!plantumlText.includes('class') && !plantumlText.includes('interface') && !plantumlText.includes('abstract')) {
        errors.push('Class diagram should contain class, interface, or abstract declarations');
      }
      break;
    case 'usecase':
      if (!plantumlText.includes('actor') && !plantumlText.includes('usecase') && !plantumlText.includes('(')) {
        errors.push('Use case diagram should contain actors and use cases');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
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
