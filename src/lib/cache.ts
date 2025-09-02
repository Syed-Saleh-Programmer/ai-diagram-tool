/**
 * Simple in-memory cache for API responses
 * This is a basic implementation - for production, consider Redis or similar
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Clean up expired entries and enforce size limit
    this.cleanup();
    
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }
}

// Create cache instances for different data types
export const diagramCache = new MemoryCache<{ description: string; plantuml: string; diagramType: string }>(50); // AI generation results
export const renderCache = new MemoryCache<string>(100); // Rendered SVG/PNG results

/**
 * Generate cache key for diagram generation
 */
export function createDiagramCacheKey(description: string, diagramType: string): string {
  // Create a simple hash of the input
  const input = `${description.trim().toLowerCase()}-${diagramType}`;
  // Use a simple string hash instead of btoa to avoid encoding issues
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate cache key for rendering
 */
export function createRenderCacheKey(plantuml: string, format: string): string {
  // Create a simple hash of the PlantUML code
  const input = `${plantuml.trim()}-${format}`;
  // Use a simple string hash instead of btoa to avoid encoding issues
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  diagramCache.clear();
  renderCache.clear();
}
