// Types for the AI Diagram Tool

export interface DiagramData {
  description: string;
  plantuml: string;
  diagramType: DiagramType;
  timestamp: number;
}

export interface GenerateRequest {
  description: string;
  diagramType?: DiagramType;
}

export interface GenerateResponse {
  description: string;
  plantuml: string;
  diagramType: DiagramType;
}

export interface EditRequest {
  plantuml: string;
  editInstructions: string;
}

export interface EditResponse {
  plantuml: string;
  changes: string[];
}

export interface RenderRequest {
  plantuml: string;
  format: 'svg' | 'png';
}

export interface RenderResponse {
  data: string; // Base64 for PNG, SVG string for SVG
  format: 'svg' | 'png';
}

export type DiagramType = 
  | 'component'
  | 'deployment' 
  | 'class'
  | 'sequence'
  | 'usecase'
  | 'activity'
  | 'state';

export type AIProvider = 'google' | 'openai' | 'anthropic';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface DiagramState {
  isGenerating: boolean;
  isEditing: boolean;
  isRendering: boolean;
  data: DiagramData | null;
  error: string | null;
  history: DiagramData[];
}

export interface PlantUMLConfig {
  theme?: string;
  direction?: 'top to bottom' | 'left to right';
  scale?: number;
  format?: 'svg' | 'png';
}

// Error types
export class AIError extends Error {
  constructor(message: string, public provider: AIProvider) {
    super(message);
    this.name = 'AIError';
  }
}

export class PlantUMLError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'PlantUMLError';
  }
}
