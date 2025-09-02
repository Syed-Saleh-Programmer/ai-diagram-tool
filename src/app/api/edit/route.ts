import { NextRequest, NextResponse } from 'next/server';
import { editDiagram } from '@/lib/ai-providers';
import { validatePlantUML } from '@/lib/plantuml';
import { EditRequest, EditResponse } from '@/lib/types';

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
    const body: EditRequest = await request.json();
    
    // Validate input
    if (!body.plantuml || typeof body.plantuml !== 'string') {
      return NextResponse.json(
        { error: 'PlantUML code is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.editInstructions || typeof body.editInstructions !== 'string') {
      return NextResponse.json(
        { error: 'Edit instructions are required and must be a string' },
        { status: 400 }
      );
    }

    if (body.editInstructions.trim().length === 0) {
      return NextResponse.json(
        { error: 'Edit instructions cannot be empty' },
        { status: 400 }
      );
    }

    if (body.editInstructions.length > 2000) {
      return NextResponse.json(
        { error: 'Edit instructions are too long (maximum 2000 characters)' },
        { status: 400 }
      );
    }

    // Validate existing PlantUML code
    const validation = validatePlantUML(body.plantuml);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid PlantUML code provided',
          validationErrors: validation.errors
        },
        { status: 400 }
      );
    }

    // Edit diagram using AI (with built-in retry and validation)
    const result = await editDiagram(
      body.plantuml.trim(),
      body.editInstructions.trim()
    );

    // Prepare response
    const response: EditResponse = {
      plantuml: result.plantuml,
      changes: result.changes
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error in /api/edit:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AIError') {
        // Check if it's a retry exhaustion error
        if (error.message.includes('after 4 attempts')) {
          return NextResponse.json(
            { 
              error: 'Failed to generate valid PlantUML after multiple editing attempts. The AI is having trouble creating proper syntax. Please try a different edit instruction or try again later.',
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
      
      if (error.name === 'PlantUMLError') {
        return NextResponse.json(
          { error: 'PlantUML processing error: ' + error.message },
          { status: 400 }
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
      { error: 'Internal server error while editing diagram' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Edit API endpoint',
      description: 'POST to this endpoint with PlantUML code and edit instructions',
      requiredFields: ['plantuml', 'editInstructions'],
      maxInstructionLength: 2000,
      examples: {
        editInstructions: [
          'Add a database component',
          'Change the arrow direction from A to B',
          'Add error handling to the sequence',
          'Make the class diagram more detailed',
          'Add authentication to the system'
        ]
      }
    },
    { status: 200 }
  );
}
