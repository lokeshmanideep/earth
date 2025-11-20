# Legal Document Assistant

An AI-powered web application that helps users fill out legal documents through conversational interfaces.

## Features

- **Smart Document Upload**: Drag-and-drop .docx/.doc files
- **AI Processing**: Backend API integration for document analysis
- **Conversational Interface**: Chat with AI to fill placeholders
- **Live Preview**: Real-time document preview
- **Download**: Generate completed documents

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- OpenAPI integration
- RESTful API

## Quick Start

1. **Install dependencies**:

```bash
npm install
```

2. **Configure environment**:

```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

3. **Start development server**:

```bash
npm run dev
```

4. **Open**: http://localhost:5173

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_KEY=your-api-key-if-required
```

## Workflow

1. Upload .docx document
2. AI processes and identifies placeholders
3. Chat interface guides through completion
4. Preview and download completed document

## API Endpoints

```
POST /api/v1/documents/upload
POST /api/v1/documents/{id}/process
GET  /api/v1/documents/{id}
POST /api/v1/documents/{id}/chat
POST /api/v1/documents/{id}/complete
GET  /api/v1/documents/{id}/download
```

## Project Structure

```
src/
├── components/
│   ├── DocumentUploadNew.tsx         # Upload interface
│   ├── ApiConversationalInterface.tsx # Chat interface
│   └── DocumentPreview.tsx           # Preview component
├── services/
│   ├── apiService.ts                 # API implementation
│   └── documentParser.ts             # Document parsing
├── types/
│   └── api.ts                        # TypeScript types
└── AppNew.tsx                        # Main application
```

## Development

```bash
npm run dev    # Start dev server
npm run build  # Build for production
npm run lint   # Run linting
```

## License

MIT License
