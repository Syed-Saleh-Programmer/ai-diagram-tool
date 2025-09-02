# AI Diagram Tool - Development Instructions

## Project Overview
A web-based tool using Next.js and PlantUML that allows users to create and edit software architecture diagrams using natural language. Users can describe their software architecture in plain English, and the AI will generate both a textual description and a visual PlantUML diagram.

## Development Phases

### Phase 1: Environment Setup & Dependencies

#### 1.1 Install Required Dependencies
```bash
# Core AI and PlantUML dependencies
npm install ai @ai-sdk/google
npm install plantuml-encoder node-plantuml
npm install @types/node-plantuml

# UI and utility dependencies
npm install lucide-react clsx tailwind-merge
npm install @radix-ui/react-select @radix-ui/react-button @radix-ui/react-textarea

# Development dependencies
npm install --save-dev @types/plantuml-encoder
```

#### 1.2 Environment Variables Setup
Create `.env.local` file:
```env
# AI Provider API Keys (choose one or multiple)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key

# Default AI provider (openai, anthropic, or google)
DEFAULT_AI_PROVIDER=openai
```

### Phase 2: Project Structure Setup

#### 2.1 Create Directory Structure
```
src/
├── app/
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts
│   │   ├── edit/
│   │   │   └── route.ts
│   │   └── render/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   └── loading-spinner.tsx
│   ├── DiagramViewer.tsx
│   ├── TextOutput.tsx
│   ├── EditDialog.tsx
│   └── DownloadButton.tsx
├── lib/
│   ├── utils.ts
│   ├── plantuml.ts
│   ├── ai-providers.ts
│   └── types.ts
└── hooks/
    └── use-diagram.ts
```

### Phase 3: Backend API Development

#### 3.1 PlantUML Utility Functions (`src/lib/plantuml.ts`)
- Encode PlantUML text using `plantuml-encoder`
- Render PlantUML to SVG/PNG using `node-plantuml`
- Handle error cases and validation
- Support multiple diagram types (component, deployment, class, sequence)

#### 3.2 AI Provider Configuration (`src/lib/ai-providers.ts`)
- Configure Vercel AI SDK for multiple providers
- Create prompt templates for diagram generation
- Handle provider switching and fallbacks
- Implement retry logic for API failures

#### 3.3 API Routes Development

**API Route: `/api/generate`**
- Input: User description text
- Process: Use AI to generate architecture description + PlantUML code
- Output: `{ description: string, plantuml: string, diagramType: string }`

**API Route: `/api/edit`**
- Input: Existing PlantUML code + edit instructions
- Process: Use AI to modify existing PlantUML based on natural language edits
- Output: `{ plantuml: string, changes: string[] }`

**API Route: `/api/render`**
- Input: PlantUML code + format preference (svg/png)
- Process: Use node-plantuml to render diagram locally
- Output: Base64 encoded image or SVG string

### Phase 4: Frontend Components Development

#### 4.1 Core UI Components (`src/components/ui/`)
- Reusable button component with loading states
- Textarea component with auto-resize
- Select component for diagram types and AI providers
- Loading spinner component

#### 4.2 Main Application Components

**DiagramViewer Component (`src/components/DiagramViewer.tsx`)**
- Display rendered PlantUML diagrams
- Support zoom in/out functionality
- Handle loading states and error messages
- Toggle between SVG and PNG views

**TextOutput Component (`src/components/TextOutput.tsx`)**
- Display AI-generated architecture description
- Syntax highlighting for PlantUML code
- Copy to clipboard functionality
- Collapsible sections for better UX

**EditDialog Component (`src/components/EditDialog.tsx`)**
- Modal dialog for editing instructions
- Natural language input for modifications
- Preview changes before applying
- History of edit operations

**DownloadButton Component (`src/components/DownloadButton.tsx`)**
- Download diagrams as PNG or SVG
- Batch download options
- Custom filename generation
- Format selection dropdown

#### 4.3 Custom Hooks (`src/hooks/use-diagram.ts`)
- State management for diagram generation flow
- API call orchestration
- Error handling and retry logic
- Caching for generated diagrams

### Phase 5: Main Page Implementation

#### 5.1 Update `src/app/page.tsx`
- Clean, intuitive interface layout
- Step-by-step workflow guidance
- Real-time feedback and progress indicators
- Responsive design for mobile/tablet

#### 5.2 Key Features Implementation
1. **Input Section**
   - Large textarea for architecture description
   - Diagram type selector (auto-detect or manual)
   - AI provider selection dropdown
   - Generate button with loading state

2. **Output Section**
   - Split view: Text description + Visual diagram
   - Tabs for switching between views
   - Full-screen diagram viewer
   - Edit and download controls

3. **Edit Workflow**
   - Inline edit button on diagram
   - Natural language edit input
   - Live preview of changes
   - Undo/redo functionality

### Phase 6: Advanced Features

#### 6.1 Diagram Type Intelligence
- Auto-detect appropriate diagram type from description
- Support for multiple PlantUML diagram types:
  - Component diagrams
  - Deployment diagrams
  - Class diagrams
  - Sequence diagrams
  - Use case diagrams

#### 6.2 AI Prompt Engineering
- Specialized prompts for different diagram types
- Context-aware editing instructions
- Best practices integration for architecture patterns
- Error correction and suggestion system

#### 6.3 User Experience Enhancements
- Keyboard shortcuts for common actions
- Diagram templates and examples
- Save/load functionality (local storage)
- Export to multiple formats
- Print-friendly layouts

### Phase 7: Testing & Quality Assurance

#### 7.1 Unit Testing
- Test PlantUML encoding/rendering functions
- Test AI prompt generation logic
- Test API route handlers
- Test component rendering and interactions

#### 7.2 Integration Testing
- End-to-end diagram generation workflow
- AI provider switching and fallbacks
- Error handling across the application
- Performance testing with large diagrams

#### 7.3 User Testing
- Test with various architecture descriptions
- Validate generated diagrams for accuracy
- Test edit functionality effectiveness
- Cross-browser compatibility testing

### Phase 8: Deployment Preparation

#### 8.1 Production Optimizations
- Implement proper error boundaries
- Add comprehensive logging
- Optimize bundle size and loading performance
- Configure proper caching strategies

#### 8.2 Security Considerations
- API rate limiting implementation
- Input validation and sanitization
- Secure handling of API keys
- CORS configuration

#### 8.3 Monitoring & Analytics
- Error tracking setup
- Performance monitoring
- Usage analytics implementation
- Health check endpoints

## Development Timeline

**Week 1**: Environment setup, dependencies, and basic project structure
**Week 2**: Backend API development (PlantUML utilities and AI integration)
**Week 3**: Core frontend components and basic UI
**Week 4**: Main page implementation and workflow integration
**Week 5**: Advanced features and edit functionality
**Week 6**: Testing, optimization, and deployment preparation

## Key Implementation Notes

1. **AI Provider Flexibility**: Design the system to easily switch between OpenAI, Anthropic, and Google AI providers based on availability and cost.

2. **PlantUML Local Rendering**: Ensure all diagram rendering happens locally using npm packages, not external PlantUML servers, for better performance and security.

3. **Error Resilience**: Implement comprehensive error handling for AI API failures, PlantUML rendering errors, and network issues.

4. **Progressive Enhancement**: Ensure the application works without JavaScript for basic functionality, then enhance with interactive features.

5. **Performance**: Implement proper caching for generated diagrams and AI responses to reduce costs and improve user experience.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Test PlantUML rendering
npm run test:plantuml
```

## Success Criteria

- [ ] Users can describe software architecture in natural language
- [ ] AI generates accurate textual descriptions and PlantUML code
- [ ] Diagrams render correctly as SVG/PNG
- [ ] Edit functionality works with natural language instructions
- [ ] Download functionality works for multiple formats
- [ ] Application is responsive and performs well
- [ ] Error handling provides clear user feedback
- [ ] Code is well-documented and maintainable

## Next Steps After Initial Development

1. Add support for collaborative editing
2. Implement diagram version control
3. Add integration with popular architecture tools
4. Create API for external integrations
5. Add premium features like advanced AI models
6. Implement user accounts and saved diagrams
