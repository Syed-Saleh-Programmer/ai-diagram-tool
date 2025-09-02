import { NextRequest, NextResponse } from 'next/server';
import { generateDiagram } from '@/lib/ai-providers';
import { createCompressedResponse } from '@/lib/compression';
import { diagramCache, createDiagramCacheKey } from '@/lib/cache';
import { GenerateRequest, GenerateResponse, DiagramType } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Validate API key exists
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable');
      return NextResponse.json(
        { error: 'AI service not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body: GenerateRequest = await request.json();
    
    // Validate input
    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    if (body.description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description cannot be empty' },
        { status: 400 }
      );
    }

    if (body.description.length > 5000) {
      return NextResponse.json(
        { error: 'Description is too long (maximum 5000 characters)' },
        { status: 400 }
      );
    }

    // Validate diagram type if provided
    const validDiagramTypes: DiagramType[] = [
      'component', 'deployment', 'class', 'sequence', 
      'usecase', 'activity', 'state'
    ];
    
    if (body.diagramType && !validDiagramTypes.includes(body.diagramType)) {
      return NextResponse.json(
        { error: 'Invalid diagram type' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = createDiagramCacheKey(body.description.trim(), body.diagramType || 'component');
    const cachedResult = diagramCache.get(cacheKey);
    
    if (cachedResult) {
      const response: GenerateResponse = {
        description: cachedResult.description,
        plantuml: cachedResult.plantuml,
        diagramType: cachedResult.diagramType as DiagramType
      };
      
      return createCompressedResponse(response, 200);
    }

    // Generate diagram using AI
    const result = await generateDiagram(
      body.description.trim(),
      body.diagramType || 'component'
    );

    // Cache the result
    diagramCache.set(cacheKey, {
      description: result.description,
      plantuml: result.plantuml,
      diagramType: result.diagramType
    }, 24 * 60 * 60 * 1000); // Cache for 24 hours

    // Prepare response
    const response: GenerateResponse = {
      description: result.description,
      plantuml: result.plantuml,
      diagramType: result.diagramType
    };

    return createCompressedResponse(response, 200);

  } catch (error) {
    console.error('Error in /api/generate:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AIError') {
        // Check if it's a retry exhaustion error
        if (error.message.includes('after 4 attempts')) {
          return NextResponse.json(
            { 
              error: 'Failed to generate valid PlantUML diagram after multiple attempts. The AI is having trouble creating proper syntax. Please try rephrasing your description or try again later.',
              details: error.message
            },
            { status: 502 }
          );
        }
        
        return NextResponse.json(
          { error: 'AI service error: ' + error.message },
          { status: 502 }
        );
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error while generating diagram' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Generate API endpoint',
      description: 'POST to this endpoint with a description to generate a diagram',
      requiredFields: ['description'],
      optionalFields: ['diagramType'],
      supportedDiagramTypes: [
        'component', 'deployment', 'class', 'sequence', 
        'usecase', 'activity', 'state'
      ]
    },
    { status: 200 }
  );
}
