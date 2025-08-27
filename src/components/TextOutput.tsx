'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/utils';
import { 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Code2,
  Eye,
  EyeOff
} from 'lucide-react';

interface TextOutputProps {
  description?: string;
  plantuml?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function TextOutput({
  description,
  plantuml,
  isLoading = false,
  error,
  className
}: TextOutputProps) {
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [copiedPlantuml, setCopiedPlantuml] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(true);
  const [plantumlExpanded, setPlantumlExpanded] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(false);

  const handleCopyDescription = useCallback(async () => {
    if (!description) return;
    
    try {
      await copyToClipboard(description);
      setCopiedDescription(true);
      setTimeout(() => setCopiedDescription(false), 2000);
    } catch (error) {
      console.error('Failed to copy description:', error);
    }
  }, [description]);

  const handleCopyPlantuml = useCallback(async () => {
    if (!plantuml) return;
    
    try {
      await copyToClipboard(plantuml);
      setCopiedPlantuml(true);
      setTimeout(() => setCopiedPlantuml(false), 2000);
    } catch (error) {
      console.error('Failed to copy PlantUML:', error);
    }
  }, [plantuml]);

  const formatPlantUMLWithLineNumbers = useCallback((content: string) => {
    if (!showLineNumbers) return content;
    
    return content
      .split('\n')
      .map((line, index) => `${(index + 1).toString().padStart(3, ' ')}  ${line}`)
      .join('\n');
  }, [showLineNumbers]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 border border-red-200 rounded-lg bg-red-50", className)}>
        <div className="text-red-600">
          <h3 className="font-semibold mb-2">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!description && !plantuml) {
    return (
      <div className={cn(
        "flex items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50",
        className
      )}>
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No content generated yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Architecture Description Section */}
      {description && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <button
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <FileText className="h-4 w-4" />
              <span>Architecture Description</span>
              {descriptionExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyDescription}
              disabled={!description}
            >
              {copiedDescription ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          {descriptionExpanded && (
            <div className="p-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PlantUML Code Section */}
      {plantuml && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <button
              onClick={() => setPlantumlExpanded(!plantumlExpanded)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Code2 className="h-4 w-4" />
              <span>PlantUML Code</span>
              {plantumlExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLineNumbers(!showLineNumbers)}
              >
                {showLineNumbers ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide Lines
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Show Lines
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPlantuml}
                disabled={!plantuml}
              >
                {copiedPlantuml ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {plantumlExpanded && (
            <div className="relative">
              <pre className="p-4 text-sm font-mono bg-gray-900 text-green-400 overflow-x-auto">
                <code>{formatPlantUMLWithLineNumbers(plantuml)}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
