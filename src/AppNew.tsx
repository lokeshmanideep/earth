import { AlertCircle, FileText, RefreshCw, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import './App.css';
import ApiConversationalInterface from './components/ApiConversationalInterface';
import DocumentPreview from './components/DocumentPreview';
import DocumentUploadNew from './components/DocumentUploadNew';
import apiService from './services/apiService';
import type {
    DocumentId,
    DocumentResponse,
    DocumentStatusType,
    DocumentUploadResponse,
    PlaceholderResponse,
    Progress
} from './types/api';
import { DocumentStatus } from './types/api';

type AppState = 'upload' | 'processing' | 'conversation' | 'preview' | 'completed';

function AppNew ()
{
    const [ currentState, setCurrentState ] = useState<AppState>( 'upload' );
    const [ document, setDocument ] = useState<DocumentResponse | null>( null );
    const [ placeholders, setPlaceholders ] = useState<PlaceholderResponse[]>( [] );
    const [ isLoading, setIsLoading ] = useState( false );
    const [ error, setError ] = useState<string>( '' );
    const [ isApiAvailable, setIsApiAvailable ] = useState( false );
    const [ isGeneratingDownload, setIsGeneratingDownload ] = useState( false );
    const [ processingProgress, setProcessingProgress ] = useState( 0 );
    const [ progress, setProgress ] = useState<Progress>( { total: 0, filled: 0, percentage: 0 } );

    useEffect( () =>
    {
        // Check if API is available on app start
        checkApiAvailability();
    }, [] );

    // Poll document status while processing
    useEffect( () =>
    {
        if ( document && document.status === DocumentStatus.PROCESSING )
        {
            const interval = setInterval( async () =>
            {
                await checkDocumentStatus();
            }, 2000 );

            return () => clearInterval( interval );
        }
    }, [ document?.status ] );

    const checkApiAvailability = async () =>
    {
        try
        {
            const info = await apiService.getApiInfo();
            setIsApiAvailable( info.isAvailable );

            if ( !info.isAvailable )
            {
                setError( 'Backend API is not available. Using local processing only.' );
            }
        } catch
        {
            setIsApiAvailable( false );
            setError( 'Failed to connect to backend API. Using local processing only.' );
        }
    };

    const checkDocumentStatus = async () =>
    {
        if ( !document ) return;

        try
        {
            const response = await apiService.getDocument( document.id );
            if ( response.success && response.data )
            {
                setDocument( response.data );

                if ( response.data.status === DocumentStatus.PROCESSED )
                {
                    // Load placeholders when processing is complete
                    await loadPlaceholders( response.data.id );
                    setCurrentState( 'conversation' );
                }
            }
        } catch ( error )
        {
            console.error( 'Error checking document status:', error );
        }
    };

    const loadPlaceholders = async ( documentId: DocumentId ) =>
    {
        try
        {
            const response = await apiService.getDocumentPlaceholders( documentId );
            if ( response.success && response.data )
            {
                setPlaceholders( response.data );
            }
        } catch ( error )
        {
            console.error( 'Error loading placeholders:', error );
        }
    };

    const handleFileUpload = async ( uploadResponse: DocumentUploadResponse ) =>
    {
        setIsLoading( true );
        setError( '' );

        try
        {
            setDocument( uploadResponse.document );
            setCurrentState( 'processing' );
            setProcessingProgress( 25 );

            // Start document processing
            const processResponse = await apiService.processDocument( uploadResponse.document.id );
            setProcessingProgress( 50 );

            if ( processResponse.success && processResponse.data )
            {
                setDocument( processResponse.data.document );
                setProcessingProgress( 75 );

                // If processing is complete, load placeholders
                if ( processResponse.data.document.status === DocumentStatus.PROCESSED )
                {
                    await loadPlaceholders( processResponse.data.document.id );
                    setProcessingProgress( 100 );
                    setCurrentState( 'conversation' );
                }
                // Otherwise, polling will handle status updates
            } else
            {
                setError( processResponse.error || 'Failed to process document' );
                setCurrentState( 'upload' );
            }
        } catch ( error )
        {
            setError( error instanceof Error ? error.message : 'Failed to process document' );
            setCurrentState( 'upload' );
        } finally
        {
            setIsLoading( false );
        }
    };

    const handlePlaceholderUpdate = async () =>
    {
        loadPlaceholders( document!.id );
    };

    const handleProgressUpdate = ( progress: Progress ) =>
    {
        setProgress( progress );
    };

    const handleConversationComplete = () =>
    {
        setCurrentState( 'preview' );
    };

    const handleDownload = async () =>
    {
        if ( !document ) return;

        setIsGeneratingDownload( true );
        try
        {
            // First, complete the document
            const completeResponse = await apiService.completeDocument( document.id );

            if ( completeResponse.success && completeResponse.data )
            {
                // Then download it
                const downloadResponse = await apiService.downloadCompletedDocument( document.id );

                if ( downloadResponse.success && downloadResponse.data )
                {
                    // Create download link
                    const blob = downloadResponse.data;
                    const url = window.URL.createObjectURL( blob );
                    const link = window.document.createElement( 'a' );
                    link.href = url;
                    link.download = `${ document.original_filename.replace( /\.[^/.]+$/, '' ) }_completed.docx`;
                    window.document.body.appendChild( link );
                    link.click();
                    window.document.body.removeChild( link );
                    window.URL.revokeObjectURL( url );

                    setCurrentState( 'completed' );
                } else
                {
                    setError( downloadResponse.error || 'Failed to download document' );
                }
            } else
            {
                setError( completeResponse.error || 'Failed to complete document' );
            }
        } catch ( error )
        {
            setError( error instanceof Error ? error.message : 'Failed to generate download' );
        } finally
        {
            setIsGeneratingDownload( false );
        }
    };

    const handleRestart = async () =>
    {
        // Reset all state
        setCurrentState( 'upload' );
        setDocument( null );
        setPlaceholders( [] );
        setError( '' );
        setProcessingProgress( 0 );

        // Check API availability again
        await checkApiAvailability();
    };

    const handleBackToConversation = () =>
    {
        setCurrentState( 'conversation' );
    };

    const handleRetryProcessing = async () =>
    {
        if ( !document ) return;

        setCurrentState( 'processing' );
        setError( '' );
        setProcessingProgress( 0 );

        try
        {
            const processResponse = await apiService.processDocument( document.id );
            if ( processResponse.success && processResponse.data )
            {
                setDocument( processResponse.data.document );
                if ( processResponse.data.document.status === DocumentStatus.PROCESSED )
                {
                    await loadPlaceholders( processResponse.data.document.id );
                    setCurrentState( 'conversation' );
                }
            } else
            {
                setError( processResponse.error || 'Failed to retry processing' );
            }
        } catch ( error )
        {
            setError( error instanceof Error ? error.message : 'Failed to retry processing' );
        }
    };

    return (
        <div className="app min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Legal Document Assistant</h1>
                                <p className="text-sm text-gray-500">AI-powered document completion via API</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* API Status Indicator */}
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${ isApiAvailable ? 'bg-green-500' : 'bg-red-400' }`}></div>
                                <span className="text-sm text-gray-600">
                                    API {isApiAvailable ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>

                            {currentState !== 'upload' && (
                                <button
                                    onClick={handleRestart}
                                    className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>New Document</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress Indicator */}
            {currentState !== 'upload' && (
                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-2 text-green-600">
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <span className="text-sm font-medium">Document Uploaded</span>
                            </div>

                            <div className={`flex items-center space-x-2 ${ currentState === 'processing' ? 'text-blue-600' :
                                [ 'conversation', 'preview', 'completed' ].includes( currentState ) ? 'text-green-600' : 'text-gray-400'
                                }`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${ currentState === 'processing' ? 'bg-blue-500' :
                                    [ 'conversation', 'preview', 'completed' ].includes( currentState ) ? 'bg-green-500' : 'bg-gray-300'
                                    }`}>
                                    <span className="text-white text-xs">
                                        {[ 'conversation', 'preview', 'completed' ].includes( currentState ) ? '✓' : '2'}
                                    </span>
                                </div>
                                <span className="text-sm font-medium">Document Processed</span>
                            </div>

                            <div className={`flex items-center space-x-2 ${ currentState === 'conversation' ? 'text-blue-600' :
                                [ 'preview', 'completed' ].includes( currentState ) ? 'text-green-600' : 'text-gray-400'
                                }`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${ currentState === 'conversation' ? 'bg-blue-500' :
                                    [ 'preview', 'completed' ].includes( currentState ) ? 'bg-green-500' : 'bg-gray-300'
                                    }`}>
                                    <span className="text-white text-xs">
                                        {[ 'preview', 'completed' ].includes( currentState ) ? '✓' : '3'}
                                    </span>
                                </div>
                                <span className="text-sm font-medium">Fill Information</span>
                            </div>

                            <div className={`flex items-center space-x-2 ${ [ 'preview', 'completed' ].includes( currentState ) ? 'text-blue-600' : 'text-gray-400'
                                }`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${ [ 'preview', 'completed' ].includes( currentState ) ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}>
                                    <span className="text-white text-xs">4</span>
                                </div>
                                <span className="text-sm font-medium">Preview & Download</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3 flex-1">
                            <p className="text-sm text-red-700">{error}</p>
                            <div className="mt-2 flex space-x-2">
                                <button
                                    onClick={() => setError( '' )}
                                    className="text-sm text-red-600 hover:text-red-800 underline"
                                >
                                    Dismiss
                                </button>
                                {currentState === 'processing' && document && (
                                    <button
                                        onClick={handleRetryProcessing}
                                        className="text-sm text-red-600 hover:text-red-800 underline"
                                    >
                                        Retry Processing
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {currentState === 'upload' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Upload Your Legal Document
                            </h2>
                            <p className="text-lg text-gray-600">
                                Our AI will help you identify and fill in all the placeholders in your document
                            </p>
                        </div>
                        <DocumentUploadNew
                            onFileUpload={handleFileUpload}
                            onError={setError}
                            isLoading={isLoading}
                            error={error}
                        />
                    </div>
                )}

                {currentState === 'processing' && document && (
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="bg-white rounded-lg shadow-sm border p-8">
                            <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Document</h2>
                            <p className="text-gray-600 mb-6">
                                Analyzing "{document.original_filename}" and extracting placeholders...
                            </p>

                            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                <div
                                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${ processingProgress }%` }}
                                ></div>
                            </div>

                            <p className="text-sm text-gray-500">
                                Status: <span className="capitalize font-medium">{document.status}</span>
                            </p>
                        </div>
                    </div>
                )}

                {currentState === 'conversation' && document && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-300px)]">
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <ApiConversationalInterface
                                documentId={document.id}
                                placeholders={placeholders}
                                onPlaceholderUpdate={handlePlaceholderUpdate}
                                onComplete={handleConversationComplete}
                                documentStatus={document.status as DocumentStatusType}
                                onProgressUpdate={handleProgressUpdate}
                                progress={progress}
                            />
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <DocumentPreview
                                originalContent={document.content_text || ''}
                                placeholders={placeholders.map( p => ( {
                                    id: p.id.toString(),
                                    label: p.placeholder_text,
                                    originalText: p.placeholder_text,
                                    value: p.filled_value || '',
                                    type: 'text',
                                    required: true
                                } ) )}
                                onDownload={handleDownload}
                                isGeneratingDownload={isGeneratingDownload}
                                progress={progress}
                            />
                            <div className="p-4 border-t bg-gray-50">
                                <button
                                    onClick={() => setCurrentState( 'preview' )}
                                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    Continue to Preview
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {[ 'preview', 'completed' ].includes( currentState ) && document && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {currentState === 'completed' ? 'Document Completed' : 'Document Preview'}
                            </h2>
                            <div className="flex space-x-2">
                                {currentState === 'preview' && (
                                    <button
                                        onClick={handleBackToConversation}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        <span>← Back to Conversation</span>
                                    </button>
                                )}
                                <button
                                    onClick={handleRestart}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    <span>Process New Document</span>
                                </button>
                            </div>
                        </div>

                        {currentState === 'completed' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-green-800">Document Successfully Completed!</h3>
                                        <p className="text-green-700">
                                            Your document has been processed and downloaded. You can now use the completed document.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden h-[calc(100vh-300px)]">
                            <DocumentPreview
                                originalContent={document.content_text || ''}
                                placeholders={placeholders.map( p => ( {
                                    id: p.id.toString(),
                                    label: p.placeholder_text,
                                    originalText: p.placeholder_text,
                                    value: p.filled_value || '',
                                    type: 'text',
                                    required: true
                                } ) )}
                                onDownload={handleDownload}
                                isGeneratingDownload={isGeneratingDownload}
                                progress={progress}
                            />
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Legal Document Assistant - Powered by AI API
                        </p>
                        <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-400">
                                {document && `Document ID: ${ document.id }`}
                            </span>
                            <span className="text-xs text-gray-400">
                                {placeholders.length > 0 && `${ placeholders.filter( p => p.is_filled ).length }/${ placeholders.length } fields completed`}
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default AppNew;