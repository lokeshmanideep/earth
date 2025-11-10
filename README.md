# Legal Document Assistant - API Integrated

An enterprise-grade web application that integrates with the Legal Document Processing API to provide AI-powered document completion through conversational interfaces.

## 🚀 Features

### Core Functionality

- **Smart Document Upload**: Drag-and-drop .docx/.doc files with validation
- **AI-Powered Processing**: Backend API integration for sophisticated document analysis
- **Conversational Interface**: Real-time chat with AI to fill document placeholders
- **Live Document Preview**: Real-time preview with placeholder highlighting
- **Automated Download**: Generate and download completed documents
- **Progress Tracking**: Visual progress indicators throughout the workflow

### API Integration

- **Full REST API Integration**: Complete implementation of Legal Document Processing API v1.0.0
- **Real-time Status Updates**: Polling for document processing status
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Type Safety**: Complete TypeScript types generated from OpenAPI specification
- **Offline Fallback**: Graceful degradation when API is unavailable

## 🛠 Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Lucide React** for consistent iconography

### API Integration

- **OpenAPI 3.1** specification compliance
- **RESTful API** with proper HTTP methods
- **WebSocket** support (ready for real-time features)
- **File Upload** with progress tracking

### Document Processing

- **mammoth** for reading .docx files (fallback)
- **docx** for generating .docx files (fallback)
- **Backend API** for primary processing

## 📋 Prerequisites

- **Node.js 20.19+** (required for Vite)
- **Legal Document Processing API** backend server
- Modern web browser with ES2020+ support

## 🔧 Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd legal-document-assistant
```

2. **Install dependencies**:

```bash
npm install
```

3. **Configure environment**:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API configuration:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_KEY=your-api-key-if-required
```

4. **Start development server**:

```bash
npm run dev
```

5. **Open in browser**: http://localhost:5173

## 🔗 API Configuration

### Required Backend API

This application requires the Legal Document Processing API backend. The API should implement the following endpoints:

```
POST /api/v1/documents/upload
POST /api/v1/documents/{id}/process
GET  /api/v1/documents/{id}
GET  /api/v1/documents/{id}/placeholders
POST /api/v1/documents/{id}/chat
POST /api/v1/documents/{id}/complete
GET  /api/v1/documents/{id}/download
GET  /health
```

### Environment Variables

| Variable            | Description            | Default                 |
| ------------------- | ---------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Backend API base URL   | `http://localhost:8000` |
| `VITE_API_KEY`      | API authentication key | (optional)              |
| `VITE_API_TIMEOUT`  | Request timeout (ms)   | `30000`                 |
| `VITE_API_RETRIES`  | Retry attempts         | `3`                     |

## 📊 Application Workflow

### 1. Document Upload

- User uploads .docx/.doc file via drag-and-drop
- File validation (size, type, format)
- Upload to backend API with progress tracking

### 2. Document Processing

- Backend extracts text and identifies placeholders
- Real-time status polling until processing complete
- Placeholder categorization and type inference

### 3. Conversational Completion

- AI-powered chat interface guides user through placeholders
- Real-time validation and error handling
- Progress tracking and completion detection

### 4. Preview & Download

- Live document preview with filled placeholders
- Completion validation and download generation
- Automated file download with proper naming

## 🏗 Project Structure

```
src/
├── components/
│   ├── DocumentUploadNew.tsx         # API-integrated upload
│   ├── ApiConversationalInterface.tsx # Chat interface
│   ├── DocumentPreview.tsx           # Preview component
│   └── [legacy components]           # Original components
├── services/
│   ├── apiService.ts                 # Complete API implementation
│   ├── documentParser.ts             # Local processing fallback
│   └── documentDownload.ts           # Local download fallback
├── types/
│   └── api.ts                        # TypeScript types from OpenAPI
├── App.tsx                        # API-integrated main app
└── App.tsx                           # Original app (legacy)
```

## 🔌 API Service Methods

### Document Management

```typescript
// Upload document
await apiService.uploadDocument(file);

// Process document
await apiService.processDocument(documentId);

// Get document details
await apiService.getDocument(documentId);

// Get placeholders
await apiService.getDocumentPlaceholders(documentId);
```

### Conversational Interface

```typescript
// Chat with document
await apiService.chatWithDocument(documentId, {
  message: "John Doe",
  conversation_id: 123,
  session_id: "session-uuid",
});
```

### Document Completion

```typescript
// Complete document
await apiService.completeDocument(documentId);

// Download completed document
await apiService.downloadCompletedDocument(documentId);
```

## 🎯 Key Features in Detail

### Smart Upload Validation

- File type validation (.docx, .doc)
- File size limits (10MB default)
- Real-time error feedback
- Progress tracking during upload

### AI-Powered Chat Interface

- Context-aware responses
- Placeholder type validation
- Session management
- Error recovery and retry logic

### Real-time Document Preview

- Live placeholder highlighting
- Progress indicators
- Completion status tracking
- Download readiness validation

### Robust Error Handling

- API connectivity detection
- Automatic retry mechanisms
- Graceful degradation to local processing
- User-friendly error messages

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with type checking

### Type Safety

All API interactions are fully typed using TypeScript interfaces generated from the OpenAPI specification.

### Error Handling

Comprehensive error handling includes:

- Network connectivity issues
- API rate limiting
- File validation errors
- Processing timeouts
- Invalid responses

## 🚦 Production Deployment

### Build Configuration

```bash
npm run build
```

### Environment Setup

Ensure production environment variables are properly configured:

```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_API_KEY=your-production-api-key
VITE_ENVIRONMENT=production
```

### Performance Considerations

- API request caching
- File upload optimization
- Progressive loading
- Error boundary implementation

## 🔍 Monitoring & Analytics

### API Health Monitoring

The application includes built-in API health checking:

```typescript
const info = await apiService.getApiInfo();
console.log("API Status:", info.isAvailable);
```

### Error Tracking

All API errors are logged with context for debugging:

- Request details
- Response status codes
- Error messages and stack traces
- User session information

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/api-enhancement`
3. **Implement changes** with proper TypeScript types
4. **Add tests** for new functionality
5. **Update documentation**
6. **Submit pull request**

### Code Standards

- TypeScript strict mode
- ESLint configuration compliance
- Comprehensive error handling
- API response validation
- Component prop typing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**API Connection Failed**

- Verify `VITE_API_BASE_URL` is correct
- Check API server is running
- Validate network connectivity
- Check CORS configuration

**Document Upload Fails**

- Verify file format (.docx, .doc)
- Check file size (max 10MB)
- Ensure API upload endpoint is accessible
- Validate file permissions

**Processing Stuck**

- Check document status via API
- Verify backend processing pipeline
- Monitor API logs for errors
- Try document reprocessing

**Chat Interface Not Responding**

- Verify conversation session is active
- Check WebSocket connections (if enabled)
- Validate chat API endpoints
- Review conversation state

### Debug Mode

Enable debug mode for detailed logging:

```env
VITE_ENABLE_DEBUG_MODE=true
```

## 🗺 Roadmap

- [ ] **WebSocket Integration** for real-time updates
- [ ] **Batch Document Processing** for multiple files
- [ ] **Document Templates** library integration
- [ ] **Advanced Analytics** and usage tracking
- [ ] **Collaborative Editing** features
- [ ] **PDF Export** support
- [ ] **Mobile App** companion
- [ ] **API Rate Limiting** handling
- [ ] **Offline Mode** with sync capabilities
- [ ] **Multi-language Support** for international documents

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS
- **Document Processing**:
  - `mammoth` - Reading .docx files
  - `docx` - Generating .docx files
- **File Handling**:
  - `react-dropzone` - File upload
  - `file-saver` - File download
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd legal-document-assistant
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (optional):

```bash
cp .env.example .env.local
# Edit .env.local with your API configuration
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage

### Basic Workflow

1. **Upload Document**: Drag and drop or click to upload a .docx file
2. **Fill Information**: Use the conversational interface to fill in detected placeholders
3. **Preview & Download**: Review the completed document and download as .docx

### Supported Placeholder Formats

The application detects various placeholder formats commonly used in legal documents:

- `{{client_name}}` - Double curly braces
- `[CLIENT_NAME]` - Square brackets (usually uppercase)
- `<<date>>` - Angle brackets
- `{amount}` - Single curly braces

### Field Types

The application automatically detects and validates different field types:

- **Text**: General text input
- **Email**: Validates email format
- **Date**: Accepts various date formats
- **Number**: Validates numeric input

## API Integration (Optional)

The application supports backend integration for enhanced features:

### Backend Endpoints

- `POST /api/documents/analyze` - Enhanced document analysis
- `POST /api/placeholders/suggestions` - AI-powered value suggestions
- `POST /api/placeholders/validate` - Advanced validation
- `POST /api/documents/generate` - Server-side document generation

### Configuration

Set the following environment variables in `.env.local`:

```env
VITE_API_BASE_URL=http://your-backend-url/api
VITE_API_KEY=your-api-key
```

## Project Structure

```
src/
├── components/
│   ├── DocumentUpload.tsx       # File upload component
│   ├── ConversationalInterface.tsx  # Chat interface
│   └── DocumentPreview.tsx      # Document preview
├── services/
│   ├── documentParser.ts        # Document parsing logic
│   ├── documentDownload.ts      # Document generation
│   └── apiService.ts           # Backend API integration
├── App.tsx                     # Main application
├── App.css                     # Application styles
└── index.css                   # Global styles
```

## Features in Detail

### Document Parser

- Extracts text from .docx files using mammoth
- Identifies placeholders using regex patterns
- Infers field types based on placeholder names
- Validates field requirements

### Conversational Interface

- Step-by-step guidance through form completion
- Real-time validation and error handling
- Support for optional fields
- Progress tracking

### Document Preview

- Live preview of filled document
- Highlighting of unfilled placeholders
- Completion progress tracking
- Download readiness validation

### Document Generation

- Converts filled content back to .docx format
- Preserves document structure and formatting
- Supports various heading levels and text formatting

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### Common Issues

1. **Document parsing fails**: Ensure the uploaded file is a valid .docx format
2. **Placeholders not detected**: Check that placeholders follow supported formats
3. **Download fails**: Verify all required fields are completed

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Roadmap

- [ ] Support for additional document formats (.doc, .pdf)
- [ ] Advanced AI-powered placeholder suggestions
- [ ] Document templates library
- [ ] Collaboration features
- [ ] Advanced formatting preservation
- [ ] Mobile app version
