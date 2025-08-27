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
 * Validate PlantUML syntax
 */
export function validatePlantUML(plantumlText: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation
  if (!plantumlText.trim()) {
    errors.push('PlantUML text cannot be empty');
    return { valid: false, errors };
  }

  // Check for @startuml and @enduml
  if (!plantumlText.includes('@startuml') || !plantumlText.includes('@enduml')) {
    errors.push('PlantUML must start with @startuml and end with @enduml');
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
