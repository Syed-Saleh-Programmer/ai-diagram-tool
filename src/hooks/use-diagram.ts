import { useState, useCallback } from 'react';
import { DiagramData, DiagramState, DiagramType, GenerateRequest, EditRequest, RenderRequest } from '@/lib/types';

interface UseDiagramOptions {
  onError?: (error: string) => void;
  onSuccess?: (data: DiagramData) => void;
}

export function useDiagram(options: UseDiagramOptions = {}) {
  const [state, setState] = useState<DiagramState>({
    isGenerating: false,
    isEditing: false,
    isRendering: false,
    data: null,
    error: null,
    history: []
  });

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
    options.onError?.(error);
  }, [options]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const addToHistory = useCallback((data: DiagramData) => {
    setState(prev => ({
      ...prev,
      history: [data, ...prev.history.slice(0, 9)] // Keep last 10 items
    }));
  }, []);

  const generateDiagram = useCallback(async (
    description: string,
    diagramType: DiagramType = 'component'
  ) => {
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    clearError();

    try {
      const request: GenerateRequest = {
        description: description.trim(),
        diagramType
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Enhanced error handling for retry failures
        let errorMessage = errorData.error || 'Failed to generate diagram';
        if (errorData.details && errorData.error.includes('after multiple attempts')) {
          errorMessage = errorData.error; // Use the detailed retry error message
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      const diagramData: DiagramData = {
        description: result.description,
        plantuml: result.plantuml,
        diagramType: result.diagramType,
        timestamp: Date.now()
      };

      setState(prev => ({ ...prev, data: diagramData, isGenerating: false }));
      addToHistory(diagramData);
      options.onSuccess?.(diagramData);

      return diagramData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setState(prev => ({ ...prev, isGenerating: false }));
      throw error;
    }
  }, [setError, clearError, addToHistory, options]);

  const editDiagram = useCallback(async (
    plantuml: string,
    editInstructions: string
  ) => {
    if (!plantuml.trim() || !editInstructions.trim()) {
      setError('Both PlantUML code and edit instructions are required');
      return;
    }

    setState(prev => ({ ...prev, isEditing: true, error: null }));
    clearError();

    try {
      const request: EditRequest = {
        plantuml: plantuml.trim(),
        editInstructions: editInstructions.trim()
      };

      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Enhanced error handling for retry failures
        let errorMessage = errorData.error || 'Failed to edit diagram';
        if (errorData.details && errorData.error.includes('after multiple editing attempts')) {
          errorMessage = errorData.error; // Use the detailed retry error message
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      const updatedData: DiagramData = {
        ...state.data!,
        plantuml: result.plantuml,
        timestamp: Date.now()
      };

      setState(prev => ({ ...prev, data: updatedData, isEditing: false }));
      addToHistory(updatedData);
      options.onSuccess?.(updatedData);

      return { data: updatedData, changes: result.changes };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setState(prev => ({ ...prev, isEditing: false }));
      throw error;
    }
  }, [state.data, setError, clearError, addToHistory, options]);

  const renderDiagram = useCallback(async (
    plantuml: string,
    format: 'svg' | 'png' = 'svg'
  ) => {
    if (!plantuml.trim()) {
      setError('PlantUML code is required for rendering');
      return;
    }

    setState(prev => ({ ...prev, isRendering: true, error: null }));
    clearError();

    try {
      const request: RenderRequest = {
        plantuml: plantuml.trim(),
        format
      };

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to render diagram');
      }

      const result = await response.json();
      setState(prev => ({ ...prev, isRendering: false }));

      return {
        data: result.data,
        format: result.format as 'svg' | 'png'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setState(prev => ({ ...prev, isRendering: false }));
      throw error;
    }
  }, [setError, clearError]);

  const loadFromHistory = useCallback((index: number) => {
    if (index >= 0 && index < state.history.length) {
      const historicalData = state.history[index];
      setState(prev => ({ ...prev, data: historicalData }));
      return historicalData;
    }
    return null;
  }, [state.history]);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      isEditing: false,
      isRendering: false,
      data: null,
      error: null,
      history: []
    });
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    generateDiagram,
    editDiagram,
    renderDiagram,
    loadFromHistory,
    clearError,
    reset,
    
    // Computed properties
    isLoading: state.isGenerating || state.isEditing || state.isRendering,
    hasData: !!state.data,
    hasHistory: state.history.length > 0
  };
}
