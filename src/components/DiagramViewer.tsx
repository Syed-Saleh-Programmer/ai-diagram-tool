'use client';

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DownloadButton } from '@/components/DownloadButton';
import { cn } from '@/lib/utils';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Edit3, 
  Maximize2, 
  Minimize2,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

interface DiagramViewerProps {
  svgContent?: string;
  pngContent?: string;
  isLoading?: boolean;
  error?: string | null;
  onEdit?: () => void;
  onRetry?: () => void;
  className?: string;
  // Props for DownloadButton
  plantumlContent?: string;
  description?: string;
  disabled?: boolean;
}

export const DiagramViewer = memo(function DiagramViewer({
  svgContent,
  pngContent,
  isLoading = false,
  error,
  onEdit,
  onRetry,
  className,
  plantumlContent,
  description,
  disabled = false
}: DiagramViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'svg' | 'png'>('svg');

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const hasContent = svgContent || pngContent;

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center min-h-[400px] border-2 border-dashed border-[var(--border)] rounded-lg bg-[var(--muted)]",
        className
      )}>
        <LoadingSpinner size="lg" text="Rendering diagram..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-[var(--destructive)] rounded-lg bg-[var(--destructive)]/10 p-6",
        className
      )}>
        <div className="text-[var(--destructive)] text-center">
          <h3 className="text-lg font-semibold mb-2">Error Rendering Diagram</h3>
          <p className="text-sm mb-4">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className={cn(
        "flex items-center justify-center min-h-full border-2 border-dashed border-[var(--border)] rounded-lg bg-[var(--muted)]",
        className
      )}>
        <div className="text-center text-[var(--muted-foreground)]">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Diagram Generated</h3>
          <p className="text-sm">Generate a diagram to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--background)]",
      isFullscreen && "fixed inset-0 z-50 border-none rounded-none",
      className
    )}>
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 bg-[var(--background)]/90 backdrop-blur-sm border-b border-[var(--border)] z-10 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex border border-[var(--border)] rounded-md">
              <Button
                variant={viewMode === 'svg' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('svg')}
                disabled={!svgContent}
                className="rounded-r-none"
              >
                <FileText className="h-4 w-4 mr-1" />
                SVG
              </Button>
              <Button
                variant={viewMode === 'png' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('png')}
                disabled={!pngContent}
                className="rounded-l-none"
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                PNG
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border border-[var(--border)] rounded-md">
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs font-medium min-w-[60px] text-center text-[var(--foreground)]">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetZoom}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Action Buttons */}
            {(svgContent || pngContent || plantumlContent) && (
              <DownloadButton
                svgContent={svgContent}
                pngContent={pngContent}
                plantumlContent={plantumlContent}
                description={description}
                disabled={disabled}
              />
            )}
            
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Diagram Content */}
      <div className="pt-12 h-full min-h-[400px] overflow-auto">
        <div 
          className="flex items-center justify-center p-4"
          style={{ 
            minHeight: isFullscreen ? 'calc(100vh - 3rem)' : '400px'
          }}
        >
          {viewMode === 'svg' && svgContent ? (
            <div 
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              className="transition-transform duration-200"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : viewMode === 'png' && pngContent ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${pngContent}`}
              alt="PlantUML Diagram"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              className="transition-transform duration-200 max-w-none"
            />
          ) : (
            <div className="text-center text-[var(--muted-foreground)]">
              <p className="text-sm">
                {viewMode === 'svg' ? 'SVG content not available' : 'PNG content not available'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div 
          className="absolute inset-0 bg-[var(--background)]/50 -z-10"
          onClick={toggleFullscreen}
        />
      )}
    </div>
  );
});
