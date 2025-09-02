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
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { useDiagram } from '@/hooks/use-diagram';
import { DiagramType } from '@/lib/types';
import { 
  Sparkles,
  FileText, 
  Image as ImageIcon, 
  History,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Network
} from 'lucide-react';

const DIAGRAM_TYPES: Array<{ value: DiagramType; label: string; description: string }> = [
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
  const [selectedDiagramType, setSelectedDiagramType] = useState<DiagramType>('component');
  const [activeTab, setActiveTab] = useState<'description' | 'diagram'>('description');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [renderedPng, setRenderedPng] = useState<string>('');
  const [examplesExpanded, setExamplesExpanded] = useState(false);

  const {
    isGenerating,
    isEditing,
    isRendering,
    isLoading,
    data,
    error,
    history,
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
    setActiveTab('description');
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
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="bg-card border-b-2 border-gray-300 dark:border-gray-600 px-6 py-3 flex-shrink-0 max-h-[60px]">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            <Network className="h-5 w-5 mr-2 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">ArchiTxt</h1>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Sidebar - Input Form */}
        <div className="w-80 bg-card border-r-2 border-gray-300 dark:border-gray-600 flex-shrink-0 overflow-y-scroll scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground hover:scrollbar-thumb-foreground"
             style={{
               scrollbarWidth: 'thin',
               scrollbarColor: 'hsl(var(--muted-foreground)) hsl(var(--muted))'
             }}>
          <div className="p-6 space-y-6">
            {/* Description Input Section */}
            <div>
              <h2 className="text-sm font-semibold mb-4 flex items-center text-foreground">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Describe Your Architecture
              </h2>
              
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
                  <label className="block text-sm font-bold text-foreground mb-2">
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
                          <div className="flex flex-col min-w-0 w-full">
                            <span className="font-medium text-[var(--foreground)] truncate">{type.label}</span>
                            <span className="text-xs text-[var(--muted-foreground)] truncate">{type.description}</span>
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
                  variant="primary"
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating Diagram...' : 'Generate Diagram'}
                </Button>
              </div>

            </div>

            {/* Examples */}
            <div className="w-full">
              <button
                onClick={() => setExamplesExpanded(!examplesExpanded)}
                className="w-full flex items-center justify-between text-sm font-semibold p-3 rounded-lg hover:bg-[var(--muted)] text-[var(--foreground)] cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-600 flex-shrink-0" />
                  <span className="truncate">Examples</span>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {examplesExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                  )}
                </div>
              </button>
              
              {examplesExpanded && (
                <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {EXAMPLE_DESCRIPTIONS.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      disabled={isLoading}
                      className="text-left w-full p-3 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] hover:border-[var(--accent-foreground)] transition-colors text-[var(--foreground)]"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-4 flex items-center text-[var(--foreground)]">
                  <History className="h-5 w-5 mr-2 text-[var(--muted-foreground)]" />
                  Recent
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-scroll scrollbar-thin scrollbar-track-[var(--muted)] scrollbar-thumb-[var(--muted-foreground)] hover:scrollbar-thumb-[var(--foreground)]"
                     style={{
                       scrollbarWidth: 'thin',
                       scrollbarColor: 'var(--muted-foreground) var(--muted)'
                     }}>
                  {history.slice(0, 5).map((item, index) => (
                    <button
                      key={item.timestamp}
                      onClick={() => handleHistoryClick(index)}
                      disabled={isLoading}
                      className="text-left w-full p-2 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
                    >
                      <div className="flex flex-col">
                        <span className="truncate text-xs">{item.description.slice(0, 40)}...</span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area - Diagram View */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-[var(--background)] border-b border-[var(--border)] flex-shrink-0">
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-3 text-sm cursor-pointer font-bold border-b-2 transition-colors ${
                  activeTab === 'description'
                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--muted)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <FileText className="h-4 w-4 mr-2 inline" />
                Description & Code
              </button>
              <button
                onClick={() => setActiveTab('diagram')}
                className={`px-4 py-3 text-sm cursor-pointer font-bold border-b-2 transition-colors ${
                  activeTab === 'diagram'
                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--muted)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <ImageIcon className="h-4 w-4 mr-2 inline" />
                Visual Diagram
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-full bg-[var(--background)] overflow-hidden">
            <div className="p-6 h-full overflow-auto">
              {activeTab === 'description' ? (
                <TextOutput
                  description={data?.description}
                  plantuml={data?.plantuml}
                  isLoading={isGenerating || isEditing}
                  error={error}
                />
              ) : (
                <div className="h-full">
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
                    plantumlContent={data?.plantuml}
                    description={data?.description}
                    disabled={isLoading}
                  />
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
      />
    </div>
  );
}
