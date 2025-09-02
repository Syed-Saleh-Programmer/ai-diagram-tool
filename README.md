# ArchiTxt

A powerful web-based application that transforms natural language descriptions into professional software architecture diagrams using AI and PlantUML. Built with Next.js 15, TypeScript, and Google's Gemini AI.

![ArchiTxt](https://img.shields.io/badge/Next.js-15.5.0-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss)

## ✨ Features

### 🤖 AI-Powered Diagram Generation
- **Natural Language Input**: Describe your architecture in plain English
- **Multiple Diagram Types**: Component, Deployment, Class, Sequence, Use Case, Activity, and State diagrams
- **Smart AI Processing**: Powered by Google Gemini for accurate diagram generation
- **Auto-Retry Logic**: Intelligent retry mechanism with validation for reliable output

### 🎨 Interactive User Interface
- **Real-time Preview**: Instant SVG and PNG diagram rendering
- **Dual-View Layout**: Side-by-side description and visual diagram
- **Responsive Design**: Mobile-first approach with professional UI
- **Dark/Light Theming**: Clean, modern interface built with Tailwind CSS

### 🛠️ Advanced Editing Capabilities
- **Natural Language Editing**: Modify diagrams using plain English instructions
- **Edit Suggestions**: 10+ pre-built editing templates for common modifications
- **Visual History**: Track and revert to previous diagram versions
- **Live Validation**: Real-time PlantUML syntax validation

### 💾 Export & Download
- **Multiple Formats**: Download as SVG, PNG, or PlantUML source code
- **Smart Naming**: Automatic filename generation based on content
- **One-Click Download**: Streamlined export process
- **Clipboard Integration**: Copy descriptions and code with one click

### 📱 User Experience
- **Professional Dashboard**: Clean, intuitive interface design
- **Example Gallery**: Pre-built architecture examples to get started
- **Error Handling**: Comprehensive error messages with helpful suggestions
- **Loading States**: Smooth animations and progress indicators

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google AI API key (Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-diagram-tool.git
   cd ai-diagram-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Google AI API key to `.env.local`:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Creating Your First Diagram

1. **Describe Your Architecture**
   - Enter a natural language description of your system
   - Example: "A microservices e-commerce platform with user service, product service, order service, and payment gateway"

2. **Select Diagram Type**
   - Choose from 7 different diagram types
   - Or let the AI auto-detect the best type

3. **Generate & Review**
   - Click "Generate Diagram" to create your visualization
   - Review both the description and visual diagram

4. **Edit & Refine**
   - Use the edit dialog for modifications
   - Apply natural language instructions like "Add a database component"

5. **Export Your Work**
   - Download in your preferred format (SVG, PNG, or PlantUML)
   - Copy code to clipboard for external use

### Diagram Types Supported

| Type | Description | Best For |
|------|-------------|----------|
| **Component** | System components and relationships | High-level architecture |
| **Deployment** | Infrastructure and deployment setup | DevOps and infrastructure |
| **Class** | Object-oriented class structures | Software design |
| **Sequence** | Interactions over time | API flows and processes |
| **Use Case** | User interactions with system | Requirements and features |
| **Activity** | Workflows and processes | Business logic |
| **State** | State transitions and lifecycles | System behavior |

## 🏗️ Architecture

### Technology Stack

**Frontend**
- **Next.js 15**: React framework with App Router
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Beautiful icon library

**AI & Processing**
- **Vercel AI SDK**: AI integration framework
- **Google Gemini**: Large language model
- **Zod**: Runtime type validation
- **PlantUML**: Diagram generation engine

**Development**
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **React Markdown**: Markdown rendering
- **Rehype/Remark**: Content processing

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── generate/      # Diagram generation endpoint
│   │   ├── edit/         # Diagram editing endpoint
│   │   └── render/       # PlantUML rendering endpoint
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── button.tsx    # Button component
│   │   ├── select.tsx    # Select dropdown
│   │   ├── textarea.tsx  # Textarea input
│   │   └── loading-spinner.tsx
│   ├── DiagramViewer.tsx # Diagram display component
│   ├── TextOutput.tsx    # Text content display
│   ├── EditDialog.tsx    # Editing interface
│   └── DownloadButton.tsx # Export functionality
├── hooks/                 # Custom React hooks
│   └── use-diagram.ts    # Diagram state management
└── lib/                  # Utility libraries
    ├── ai-providers.ts   # AI integration logic
    ├── plantuml.ts       # PlantUML utilities
    ├── types.ts          # TypeScript definitions
    └── utils.ts          # Helper functions
```

### API Endpoints

| Endpoint | Method | Purpose | Input | Output |
|----------|---------|---------|-------|--------|
| `/api/generate` | POST | Generate new diagram | `{ description, diagramType }` | `{ description, plantuml, diagramType }` |
| `/api/edit` | POST | Edit existing diagram | `{ plantuml, editInstructions }` | `{ plantuml, changes }` |
| `/api/render` | POST | Render PlantUML to image | `{ plantuml, format }` | Base64 image data |

## 🔧 Configuration

### Environment Variables

```env
# Required: Google AI API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Optional: Development settings
NODE_ENV=development
```

### Customization Options

- **Diagram Templates**: Modify prompt templates in `src/lib/ai-providers.ts`
- **UI Themes**: Customize colors and styling in `src/app/globals.css`
- **Component Behavior**: Adjust settings in component files
- **AI Parameters**: Fine-tune temperature and model settings

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Type checking
npx tsc --noEmit     # TypeScript type checking
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with Next.js rules
- **Prettier**: Code formatting (via ESLint)
- **Validation**: Runtime validation with Zod schemas

## 📚 Documentation

Comprehensive documentation is available in the `/KnowledgeBase` directory:

- **`dev-instructions.md`**: Detailed development guide and setup instructions
- **`updates.md`**: Development progress log and feature implementation history
- **`MIGRATION_PLAN.md`**: Technical migration plans and architecture decisions
- **`RETRY_IMPLEMENTATION.md`**: Error handling and retry logic documentation

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 🐛 Troubleshooting

### Common Issues

**API Key Issues**
```bash
Error: Google Generative AI API key is missing
```
**Solution**: Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is set in `.env.local`

**PlantUML Rendering Errors**
```bash
Error: PlantUML rendering failed
```
**Solution**: Check diagram syntax and retry. The tool includes auto-retry logic.

**Build Errors**
```bash
Error: Module not found
```
**Solution**: Run `npm install` to ensure all dependencies are installed


## 🙏 Acknowledgments

- **Google AI**: For providing the Gemini language model
- **PlantUML**: For the diagram generation engine
- **Vercel**: For the AI SDK and deployment platform
- **Radix UI**: For accessible component primitives
- **Next.js Team**: For the amazing React framework

---

**Built with ❤️ by [Syed Muhammad Saleh]** | **Powered by AI and Open Source**
