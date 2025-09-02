import { NextResponse } from 'next/server';

/**
 * Minify SVG content by removing unnecessary whitespace and comments
 */
export function minifySVG(svgContent: string): string {
  return svgContent
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove unnecessary whitespace between tags
    .replace(/>\s+</g, '><')
    // Remove leading/trailing whitespace
    .trim()
    // Remove extra spaces in attributes
    .replace(/\s+/g, ' ')
    // Remove empty attributes
    .replace(/\s*=\s*""\s*/g, '');
}

/**
 * Create a JSON response with proper headers (optimized for caching)
 */
export function createCompressedResponse(data: unknown, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Add caching headers for better performance
  if (status === 200) {
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 minutes
  }
  
  // Let Next.js handle actual compression automatically
  return response;
}

/**
 * Estimate response size for logging
 */
export function estimateResponseSize(data: unknown): number {
  return JSON.stringify(data).length;
}
