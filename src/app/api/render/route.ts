import { NextRequest, NextResponse } from 'next/server';
import { renderPlantUMLWeb, validatePlantUML } from '@/lib/plantuml';
import { RenderRequest, RenderResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RenderRequest = await request.json();
    
    // Validate input
    if (!body.plantuml || typeof body.plantuml !== 'string') {
      return NextResponse.json(
        { error: 'PlantUML code is required and must be a string' },
        { status: 400 }
      );
    }

    if (body.plantuml.trim().length === 0) {
      return NextResponse.json(
        { error: 'PlantUML code cannot be empty' },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ['svg', 'png'];
    const format = body.format || 'svg';
    
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: svg, png' },
        { status: 400 }
      );
    }

    // Validate PlantUML syntax
    const validation = validatePlantUML(body.plantuml);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid PlantUML code',
          validationErrors: validation.errors
        },
        { status: 400 }
      );
    }

    // Render diagram
    const renderedData = await renderPlantUMLWeb(body.plantuml.trim(), format);

    // Prepare response
    const response: RenderResponse = {
      data: renderedData,
      format: format
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error in /api/render:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'PlantUMLError') {
        // Check if it's a network error
        if (error.message.includes('NETWORK_ERROR') || error.message.includes('Failed to fetch')) {
          return NextResponse.json(
            { error: 'Unable to reach PlantUML rendering service. Please try again later.' },
            { status: 503 }
          );
        }
        
        // Check if it's a rendering error
        if (error.message.includes('RENDER_ERROR')) {
          return NextResponse.json(
            { error: 'Failed to render diagram. Please check your PlantUML syntax.' },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: 'PlantUML processing error: ' + error.message },
          { status: 400 }
        );
      }

      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Rendering timeout. The diagram might be too complex.' },
          { status: 408 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error while rendering diagram' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Render API endpoint',
      description: 'POST to this endpoint with PlantUML code to render as SVG or PNG',
      requiredFields: ['plantuml'],
      optionalFields: ['format'],
      supportedFormats: ['svg', 'png'],
      defaultFormat: 'svg',
      examples: {
        plantuml: '@startuml\nA --> B\n@enduml',
        format: 'svg'
      },
      note: 'SVG format returns SVG string, PNG format returns base64 encoded image'
    },
    { status: 200 }
  );
}
