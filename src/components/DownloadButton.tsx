'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { downloadFile, downloadBase64, generateFilename } from '@/lib/utils';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Check,
  AlertCircle
} from 'lucide-react';

interface DownloadButtonProps {
  svgContent?: string;
  pngContent?: string;
  plantumlContent?: string;
  description?: string;
  onDownload?: (format: 'svg' | 'png' | 'plantuml') => void;
  disabled?: boolean;
  className?: string;
}

export function DownloadButton({
  svgContent,
  pngContent,
  plantumlContent,
  description = "diagram",
  onDownload,
  disabled = false,
  className
}: DownloadButtonProps) {
  const [selectedFormat, setSelectedFormat] = useState<'svg' | 'png' | 'plantuml'>('svg');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const getAvailableFormats = useCallback(() => {
    const formats: Array<{ value: 'svg' | 'png' | 'plantuml'; label: string; icon: React.ReactNode; available: boolean }> = [
      {
        value: 'svg',
        label: 'SVG Vector',
        icon: <FileText className="h-4 w-4" />,
        available: !!svgContent
      },
      {
        value: 'png',
        label: 'PNG Image',
        icon: <ImageIcon className="h-4 w-4" />,
        available: !!pngContent
      },
      {
        value: 'plantuml',
        label: 'PlantUML Code',
        icon: <FileText className="h-4 w-4" />,
        available: !!plantumlContent
      }
    ];

    return formats.filter(format => format.available);
  }, [svgContent, pngContent, plantumlContent]);

  const handleDownload = useCallback(async () => {
    if (disabled || isDownloading) return;

    setIsDownloading(true);
    setDownloadStatus('idle');

    try {
      let filename: string;
      
      switch (selectedFormat) {
        case 'svg':
          filename = generateFilename(description, 'svg');
          if (svgContent) {
            downloadFile(svgContent, filename, 'image/svg+xml');
            onDownload?.('svg');
          }
          break;
          
        case 'png':
          filename = generateFilename(description, 'png');
          if (pngContent) {
            downloadBase64(pngContent, filename, 'image/png');
            onDownload?.('png');
          }
          break;
          
        case 'plantuml':
          // Generate custom filename for PlantUML
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          const cleanDescription = description
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 30);
          filename = `${cleanDescription || 'diagram'}-${timestamp}.puml`;
          
          if (plantumlContent) {
            downloadFile(plantumlContent, filename, 'text/plain');
            onDownload?.('plantuml');
          }
          break;
          
        default:
          throw new Error('Invalid format selected');
      }

      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 2000);
      
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } finally {
      setIsDownloading(false);
    }
  }, [
    selectedFormat, 
    svgContent, 
    pngContent, 
    plantumlContent, 
    description, 
    disabled, 
    isDownloading, 
    onDownload
  ]);

  const availableFormats = getAvailableFormats();
  const hasContent = availableFormats.length > 0;
  
  // Auto-select first available format if current selection is not available
  React.useEffect(() => {
    if (availableFormats.length > 0 && !availableFormats.some(f => f.value === selectedFormat)) {
      setSelectedFormat(availableFormats[0].value);
    }
  }, [availableFormats, selectedFormat]);

  if (!hasContent) {
    return (
      <Button 
        variant="outline" 
        disabled 
        className={cn("opacity-50 border-[var(--border)]", className)}
      >
        <Download className="h-4 w-4 mr-2" />
        No Content
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Format Selector */}
      <Select
        value={selectedFormat}
        onValueChange={(value: 'svg' | 'png' | 'plantuml') => setSelectedFormat(value)}
        disabled={disabled || isDownloading}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent>
          {availableFormats.map((format) => (
            <SelectItem key={format.value} value={format.value}>
              <div className="flex items-center space-x-2">
                {format.icon}
                <span>{format.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Download Button */}
      <Button
        onClick={handleDownload}
        disabled={disabled || isDownloading || !hasContent}
        variant={downloadStatus === 'success' ? 'default' : 'primary'}
        className={cn(
          downloadStatus === 'error' && "border-red-300 text-red-600 hover:bg-red-50 bg-white"
        )}
      >
        {downloadStatus === 'success' ? (
          <>
            <Check className="h-4 w-4 mr-2 text-green-600" />
            Downloaded
          </>
        ) : downloadStatus === 'error' ? (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Failed
          </>
        ) : isDownloading ? (
          <>
            <div className="animate-spin h-4 w-4 mr-2">
              <Download className="h-4 w-4" />
            </div>
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download
          </>
        )}
      </Button>
    </div>
  );
}
