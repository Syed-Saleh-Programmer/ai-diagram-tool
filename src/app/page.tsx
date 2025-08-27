'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DiagramViewer } from '@/components/DiagramViewer';
import { TextOutput } from '@/components/TextOutput';
import { EditDialog } from '@/components/EditDialog';
import { DownloadButton } from '@/components/DownloadButton';
import { useDiagram } from '@/hooks/use-diagram';
import { DiagramType } from '@/lib/types';
import { 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  History,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

const DIAGRAM_TYPES: Array<{ value: DiagramType; label: string; description: string }> = [
  { value: 'auto', label: 'Auto-detect', description: 'Let AI choose the best diagram type' },
  { value: 'component', label: 'Component', description: 'System components and their relationships' },
  { value: 'deployment', label: 'Deployment', description: 'Infrastructure and deployment architecture' },
  { value: 'class', label: 'Class', description: 'Object-oriented class structures' },
  { value: 'sequence', label: 'Sequence', description: 'Interactions over time' },
  { value: 'usecase', label: 'Use Case', description: 'User interactions with the system' },
  { value: 'activity', label: 'Activity', description: 'Workflows and processes' },
  { value: 'state', label: 'State', description: 'State transitions and lifecycles' }
];

const EXAMPLE_DESCRIPTIONS = [
  "A microservices e-commerce platform with user service, product service, order service, and payment gateway, connected through an API gateway with a Redis cache and PostgreSQL databases.",
  "A web application with React frontend, Node.js backend, MongoDB database, and Redis cache, deployed on AWS with load balancer and auto-scaling.",
  "A user authentication system with login, registration, password reset, and social login features using OAuth2.",
  "A real-time chat application with WebSocket connections, message queuing, and user presence tracking."
];

export default function Home() {
  const [description, setDescription] = useState('');
  const [selectedDiagramType, setSelectedDiagramType] = useState<DiagramType>('auto');
  const [activeTab, setActiveTab] = useState<'description' | 'diagram'>('description');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [renderedPng, setRenderedPng] = useState<string>('');

  const {
    isGenerating,
    isEditing,
    isRendering,
    isLoading,
    data,
    error,
    history,
    hasData,
    generateDiagram,
    editDiagram,
    renderDiagram,
    loadFromHistory,
    clearError
  } = useDiagram({
    onError: (error) => {
      console.error('Diagram error:', error);
    },
    onSuccess: async (data) => {
      // Auto-render the diagram when generated
      try {
        const svgResult = await renderDiagram(data.plantuml, 'svg');
        if (svgResult) {
          setRenderedSvg(svgResult.data);
        }
        
        const pngResult = await renderDiagram(data.plantuml, 'png');
        if (pngResult) {
          setRenderedPng(pngResult.data);
        }
      } catch (error) {
        console.error('Failed to render diagram:', error);
      }
    }
  });

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    clearError();
    setActiveTab('diagram');
    await generateDiagram(description, selectedDiagramType);
  };

  const handleEdit = async (instructions: string) => {
    if (!data?.plantuml) return;
    
    const result = await editDiagram(data.plantuml, instructions);
    if (result) {
      // Auto-render the edited diagram
      try {
        const svgResult = await renderDiagram(result.data.plantuml, 'svg');
        if (svgResult) {
          setRenderedSvg(svgResult.data);
        }
        
        const pngResult = await renderDiagram(result.data.plantuml, 'png');
        if (pngResult) {
          setRenderedPng(pngResult.data);
        }
      } catch (error) {
        console.error('Failed to render edited diagram:', error);
      }
    }
  };

  const handleExampleClick = (example: string) => {
    setDescription(example);
  };

  const handleHistoryClick = (index: number) => {
    const historicalData = loadFromHistory(index);
    if (historicalData) {
      setActiveTab('diagram');
      // Re-render the historical diagram
      renderDiagram(historicalData.plantuml, 'svg').then(result => {
        if (result) setRenderedSvg(result.data);
      });
      renderDiagram(historicalData.plantuml, 'png').then(result => {
        if (result) setRenderedPng(result.data);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <Sparkles className="h-8 w-8 mr-3 text-blue-600" />
            AI Diagram Tool
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create professional software architecture diagrams using natural language. 
            Describe your system and let AI generate beautiful PlantUML diagrams.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Describe Your Architecture
              </h2>
              
              {/* Description Input */}
              <div className="space-y-4">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your software architecture in natural language..."
                  rows={6}
                  autoResize
                  disabled={isLoading}
                  className="w-full"
                />
                
                {/* Diagram Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagram Type
                  </label>
                  <Select
                    value={selectedDiagramType}
                    onValueChange={(value: DiagramType) => setSelectedDiagramType(value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select diagram type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAGRAM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-gray-500">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!description.trim() || isLoading}
                  loading={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating Diagram...' : 'Generate Diagram'}
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Error</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Examples */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                Example Descriptions
              </h3>
              <div className="space-y-2">
                {EXAMPLE_DESCRIPTIONS.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    disabled={isLoading}
                    className="text-left w-full p-3 text-sm border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <History className="h-5 w-5 mr-2 text-gray-600" />
                  Recent Diagrams
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {history.slice(0, 5).map((item, index) => (
                    <button
                      key={item.timestamp}
                      onClick={() => handleHistoryClick(index)}
                      disabled={isLoading}
                      className="text-left w-full p-2 text-sm border rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.description.slice(0, 50)}...</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="border-b">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'description'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-2 inline" />
                    Description & Code
                  </button>
                  <button
                    onClick={() => setActiveTab('diagram')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'diagram'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4 mr-2 inline" />
                    Visual Diagram
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'description' ? (
                  <TextOutput
                    description={data?.description}
                    plantuml={data?.plantuml}
                    isLoading={isGenerating || isEditing}
                    error={error}
                  />
                ) : (
                  <div className="space-y-4">
                    <DiagramViewer
                      svgContent={renderedSvg}
                      pngContent={renderedPng}
                      isLoading={isRendering}
                      error={error}
                      onEdit={() => setEditDialogOpen(true)}
                      onRetry={() => {
                        if (data?.plantuml) {
                          renderDiagram(data.plantuml, 'svg').then(result => {
                            if (result) setRenderedSvg(result.data);
                          });
                          renderDiagram(data.plantuml, 'png').then(result => {
                            if (result) setRenderedPng(result.data);
                          });
                        }
                      }}
                    />
                    
                    {/* Download Controls */}
                    {hasData && (
                      <div className="flex justify-center">
                        <DownloadButton
                          svgContent={renderedSvg}
                          pngContent={renderedPng}
                          plantumlContent={data?.plantuml}
                          description={data?.description}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <EditDialog
          isOpen={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onEdit={handleEdit}
          isLoading={isEditing}
          error={error}
          currentPlantuml={data?.plantuml}
        />
      </div>
    </div>
  );
}
