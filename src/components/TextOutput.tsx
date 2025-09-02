'use client';

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
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

export const TextOutput = memo(function TextOutput({
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
          <div className="h-4 bg-[var(--muted)] rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-[var(--muted)] rounded"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-5/6"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-4/6"></div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--muted)] rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-2/3"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isRetryError = error.includes('after multiple attempts') || error.includes('after multiple editing attempts');
    
    return (
      <div className={cn("p-4 border border-[var(--destructive)] rounded-lg bg-[var(--destructive)]/10", className)}>
        <div className="text-[var(--destructive)]">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">
                {isRetryError ? 'Generation Failed After Multiple Attempts' : 'Error'}
              </h3>
              <p className="text-sm mb-3">{error}</p>
              {isRetryError && (
                <div className="text-sm">
                  <p className="font-medium mb-2">Suggestions to resolve this:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Try rephrasing your description to be more specific</li>
                    <li>Use simpler language and avoid complex technical jargon</li>
                    <li>Break down complex architectures into smaller parts</li>
                    <li>Wait a moment and try again</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!description && !plantuml) {
    return (
      <div className={cn(
        "flex items-center justify-center min-h-full border-2 border-dashed border-[var(--border)] rounded-lg bg-[var(--muted)]",
        className
      )}>
        <div className="text-center text-[var(--muted-foreground)]">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No content generated yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Architecture Description Section */}
      {description && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="bg-[var(--muted)] px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <button
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              className="flex items-center space-x-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--foreground)]/80"
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
              <div className="prose prose-sm max-w-none prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground)] prose-strong:text-[var(--foreground)] prose-code:text-[var(--primary)] prose-code:bg-[var(--muted)] prose-code:px-1 prose-code:rounded prose-pre:bg-[var(--muted)] prose-pre:text-[var(--foreground)]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Custom styling for inline code
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return match ? (
                        // For code blocks with language specification
                        <code className={className} {...props}>
                          {children}
                        </code>
                      ) : (
                        // For inline code
                        <code 
                          className="text-[var(--primary)] bg-[var(--muted)] px-1 py-0.5 rounded text-sm font-mono" 
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    },
                    // Custom styling for headings
                    h1: ({ children, ...props }) => (
                      <h1 className="text-xl font-bold text-[var(--foreground)] mb-4 mt-6 first:mt-0" {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3 mt-5" {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 className="text-base font-medium text-[var(--foreground)] mb-2 mt-4" {...props}>
                        {children}
                      </h3>
                    ),
                    // Custom styling for lists
                    ul: ({ children, ...props }) => (
                      <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
                        {children}
                      </ol>
                    ),
                    li: ({ children, ...props }) => (
                      <li className="text-[var(--foreground)]" {...props}>
                        {children}
                      </li>
                    ),
                    // Custom styling for blockquotes
                    blockquote: ({ children, ...props }) => (
                      <blockquote 
                        className="border-l-4 border-[var(--primary)] pl-4 py-2 bg-[var(--accent)] rounded-r text-[var(--foreground)] my-4 italic" 
                        {...props}
                      >
                        {children}
                      </blockquote>
                    ),
                    // Custom styling for tables
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead className="bg-[var(--muted)]" {...props}>
                        {children}
                      </thead>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="px-4 py-2 text-left text-sm font-medium text-[var(--foreground)] border-b border-[var(--border)]" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="px-4 py-2 text-sm text-[var(--foreground)] border-b border-[var(--border)]" {...props}>
                        {children}
                      </td>
                    ),
                    // Custom styling for paragraphs
                    p: ({ children, ...props }) => (
                      <p className="text-[var(--foreground)] leading-relaxed mb-3" {...props}>
                        {children}
                      </p>
                    ),
                    // Custom styling for emphasis
                    strong: ({ children, ...props }) => (
                      <strong className="font-semibold text-[var(--foreground)]" {...props}>
                        {children}
                      </strong>
                    ),
                    em: ({ children, ...props }) => (
                      <em className="italic text-[var(--foreground)]" {...props}>
                        {children}
                      </em>
                    ),
                    // Custom styling for links
                    a: ({ children, ...props }) => (
                      <a 
                        className="text-[var(--primary)] hover:text-[var(--primary-hover)] underline transition-colors" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    // Custom styling for horizontal rules
                    hr: ({ ...props }) => (
                      <hr className="my-6 border-gray-300" {...props} />
                    )
                  }}
                >
                  {description}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PlantUML Code Section */}
      {plantuml && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="bg-[var(--muted)] px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <button
              onClick={() => setPlantumlExpanded(!plantumlExpanded)}
              className="flex items-center space-x-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--foreground)]/80"
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
              <pre className="p-4 text-sm font-mono bg-[var(--muted)] text-green-400 overflow-x-auto">
                <code>{formatPlantUMLWithLineNumbers(plantuml)}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
