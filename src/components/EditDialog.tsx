'use client';

import React, { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  X, 
  Edit3, 
  Send, 
  RotateCcw, 
  History,
  Lightbulb
} from 'lucide-react';

interface EditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (instructions: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  editHistory?: string[];
}

const EDIT_SUGGESTIONS = [
  "Add a database component to the system",
  "Change the arrow direction between components A and B",
  "Add error handling to the sequence diagram",
  "Make the class relationships more detailed",
  "Add authentication flow to the system",
  "Include a load balancer in the deployment",
  "Add logging and monitoring components",
  "Show the data flow between services",
  "Add mobile client to the architecture",
  "Include caching layer in the system"
];

export function EditDialog({
  isOpen,
  onOpenChange,
  onEdit,
  isLoading = false,
  error,
  editHistory = []
}: EditDialogProps) {
  const [instructions, setInstructions] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalInstructions = selectedSuggestion || instructions;
    if (!finalInstructions.trim()) return;

    try {
      await onEdit(finalInstructions.trim());
      setInstructions('');
      setSelectedSuggestion(null);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the parent component
      console.error('Edit failed:', error);
    }
  }, [instructions, selectedSuggestion, onEdit, onOpenChange]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSelectedSuggestion(suggestion);
    setInstructions(suggestion);
  }, []);

  const handleClearInstructions = useCallback(() => {
    setInstructions('');
    setSelectedSuggestion(null);
  }, []);

  const handleHistoryClick = useCallback((historyItem: string) => {
    setInstructions(historyItem);
    setSelectedSuggestion(null);
  }, []);

  const canSubmit = (instructions.trim() || selectedSuggestion) && !isLoading;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-blue-600" />
                <Dialog.Title className="text-lg font-semibold">
                  Edit Diagram
                </Dialog.Title>
              </div>
              
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" disabled={isLoading}>
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Instructions Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edit Instructions
                  </label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => {
                      setInstructions(e.target.value);
                      setSelectedSuggestion(null);
                    }}
                    placeholder="Describe what changes you'd like to make to the diagram..."
                    rows={4}
                    autoResize
                    disabled={isLoading}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe your changes in natural language. For example: &quot;Add a database&quot;, &quot;Change colors&quot;, &quot;Add more detail&quot;
                  </p>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Quick Suggestions */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Quick Suggestions</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EDIT_SUGGESTIONS.slice(0, 6).map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isLoading}
                        className={cn(
                          "text-left p-2 text-xs border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors",
                          selectedSuggestion === suggestion && "bg-blue-50 border-blue-300"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit History */}
                {editHistory.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <History className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Recent Edits</span>
                    </div>
                    
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {editHistory.slice(0, 5).map((historyItem, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleHistoryClick(historyItem)}
                          disabled={isLoading}
                          className="text-left w-full p-2 text-xs text-gray-600 border rounded hover:bg-gray-50 transition-colors"
                        >
                          {historyItem}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClearInstructions}
                    disabled={isLoading || (!instructions && !selectedSuggestion)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Dialog.Close asChild>
                      <Button type="button" variant="outline" disabled={isLoading}>
                        Cancel
                      </Button>
                    </Dialog.Close>
                    
                    <Button 
                      type="submit" 
                      disabled={!canSubmit}
                      loading={isLoading}
                    >
                      {isLoading ? (
                        <span>Applying Changes...</span>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Apply Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
