import { AlertCircle, Bot, CheckCircle, Send, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import apiService from '../services/apiService';
import type {
    ChatMessage,
    ChatResponse,
    DocumentId,
    DocumentStatusType,
    PlaceholderResponse,
    Progress
} from '../types/api';

interface Message
{
    id: string;
    type: 'bot' | 'user';
    content: string;
    timestamp: Date;
    placeholderId?: number;
    error?: boolean;
}

interface ApiConversationalInterfaceProps
{
    documentId: DocumentId;
    placeholders: PlaceholderResponse[];
    onPlaceholderUpdate: ( placeholderId: number, value: string ) => void;
    onComplete: () => void;
    documentStatus: DocumentStatusType;
    onProgressUpdate: ( progress: Progress ) => void;
    progress: Progress;
}

const ApiConversationalInterface: React.FC<ApiConversationalInterfaceProps> = ( {
    documentId,
    placeholders,
    onPlaceholderUpdate,
    onComplete,
    documentStatus,
    onProgressUpdate,
    progress
} ) =>
{
    const [ messages, setMessages ] = useState<Message[]>( [] );
    const [ currentInput, setCurrentInput ] = useState( '' );
    const [ isLoading, setIsLoading ] = useState( false );
    const [ conversationId, setConversationId ] = useState<number | null>( null );
    const [ sessionId, setSessionId ] = useState<string | null>( null );
    const [ currentPlaceholder, setCurrentPlaceholder ] = useState<PlaceholderResponse | null>( null );
    const [ isCompleted, setIsCompleted ] = useState( false );
    const [ error, setError ] = useState<string>( '' );
    const messagesEndRef = useRef<HTMLDivElement>( null );
    const initializationRef = useRef<boolean>( false );

    useEffect( () =>
    {
        // Initialize conversation when component mounts
        if ( documentId && !conversationId && !initializationRef.current )
        {
            initializationRef.current = true;
            initializeConversation();
        }
    }, [ documentId ] );

    useEffect( () =>
    {
        console.log( 'Messages updated:', messages );
        scrollToBottom();
    }, [ messages ] );

    useEffect( () =>
    {
        // Check if all placeholders are filled
        const unfilledPlaceholders = placeholders.filter( p => !p.is_filled );
        if ( unfilledPlaceholders.length === 0 && placeholders.length > 0 )
        {
            handleConversationComplete();
        }
    }, [ placeholders ] );

    const scrollToBottom = () =>
    {
        messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
    };

    const initializeConversation = async () =>
    {
        try
        {
            setIsLoading( true );
            setError( '' );

            const welcomeMessage: Message = {
                id: 'welcome',
                type: 'bot',
                content: `Hi! I'll help you fill out this legal document. I found ${ placeholders.length } fields that need to be completed. Let's start!`,
                timestamp: new Date()
            };

            setMessages( [ welcomeMessage ] );

            // Send initial message to start the conversation
            const response = await apiService.chatWithDocument( documentId, {
                message: 'Start filling document placeholders',
                conversation_id: conversationId,
                session_id: sessionId
            } );

            if ( response.success && response.data )
            {
                handleChatResponse( response.data );
            } else
            {
                setError( response.error || 'Failed to start conversation' );
            }
        } catch ( error )
        {
            setError( error instanceof Error ? error.message : 'Failed to initialize conversation' );
        } finally
        {
            setIsLoading( false );
        }
    };

    const handleChatResponse = ( chatResponse: ChatResponse ) =>
    {
        // Update conversation state
        console.log( 'Chat response received:', chatResponse );
        setConversationId( chatResponse.conversation_id );
        setSessionId( chatResponse.session_id );
        setCurrentPlaceholder( chatResponse.current_placeholder || null );
        setIsCompleted( chatResponse.is_complete );

        // Add bot response to messages
        const botMessage: Message = {
            id: `bot_${ Date.now() }`,
            type: 'bot',
            content: chatResponse.response,
            timestamp: new Date(),
            placeholderId: chatResponse.current_placeholder?.id
        };

        setMessages( prev => [ ...prev, botMessage ] );

        // Check if conversation is complete
        if ( chatResponse.is_complete )
        {
            handleConversationComplete();
        }
    };

    const handleConversationComplete = () =>
    {
        if ( !isCompleted )
        {
            const completionMessage: Message = {
                id: 'completion',
                type: 'bot',
                content: '🎉 Excellent! I\'ve filled in all the required fields in your document. You can now preview the completed document and download it.',
                timestamp: new Date()
            };

            setMessages( prev => [ ...prev, completionMessage ] );
            setIsCompleted( true );
            onComplete();
        }
    };

    const handleSubmit = async ( e: React.FormEvent ) =>
    {
        e.preventDefault();
        if ( !currentInput.trim() || isLoading ) return;
        const currentInputCopy = currentInput;
        const userMessage: Message = {
            id: `user_${ Date.now() }`,
            type: 'user',
            content: currentInputCopy,
            timestamp: new Date()
        };
        setCurrentInput( '' );
        setMessages( prev => [ ...prev, userMessage ] );
        setIsLoading( true );
        setError( '' );
        let id = currentPlaceholder ? currentPlaceholder.id : 0;
        try
        {
            const chatMessage: ChatMessage = {
                message: currentInputCopy,
                conversation_id: conversationId,
                session_id: sessionId
            };

            const response = await apiService.chatWithDocument( documentId, chatMessage );

            if ( response.success && response.data )
            {

                onPlaceholderUpdate( id, currentInputCopy );
                onProgressUpdate( response.data.progress );
                handleChatResponse( response.data );
            } else
            {
                const errorMessage: Message = {
                    id: `error_${ Date.now() }`,
                    type: 'bot',
                    content: response.error || 'Sorry, I encountered an error processing your response. Please try again.',
                    timestamp: new Date(),
                    error: true
                };
                setMessages( prev => [ ...prev, errorMessage ] );
                setError( response.error || 'Chat error occurred' );
            }
        } catch ( error )
        {
            const errorMessage: Message = {
                id: `error_${ Date.now() }`,
                type: 'bot',
                content: 'Sorry, I encountered a technical error. Please try again.',
                timestamp: new Date(),
                error: true
            };
            setMessages( prev => [ ...prev, errorMessage ] );
            setError( error instanceof Error ? error.message : 'Unknown error' );
        } finally
        {
            setIsLoading( false );
        }
    };

    const formatTime = ( date: Date ): string =>
    {
        return date.toLocaleTimeString( [], { hour: '2-digit', minute: '2-digit' } );
    };

    return (
        <div className="api-conversational-interface flex flex-col h-full">
            {/* Header */}
            <div className="border-b bg-white p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">AI Document Assistant</h3>
                    <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-600">
                            Progress: {progress.filled}/{progress.total}
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${ progress.percentage }%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Current Placeholder Info */}
                {currentPlaceholder && !isCompleted && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                            <strong>Current field:</strong> {currentPlaceholder.placeholder_text}
                            {currentPlaceholder.description && (
                                <span className="text-blue-600"> - {currentPlaceholder.description}</span>
                            )}
                        </p>
                    </div>
                )}

                {/* Status Indicator */}
                <div className="mt-2 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${ documentStatus === 'processed' ? 'bg-green-500' :
                        documentStatus === 'processing' ? 'bg-yellow-500' :
                            'bg-gray-400'
                        }`}></div>
                    <span className="text-xs text-gray-600 capitalize">{documentStatus}</span>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 mx-4 mt-2">
                    <div className="flex">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                        <div className="ml-2">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map( ( message ) => (
                    <div
                        key={message.id}
                        className={`flex ${ message.type === 'user' ? 'justify-end' : 'justify-start' }`}
                    >
                        <div
                            className={`
                max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm
                ${ message.type === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : message.error
                                        ? 'bg-red-50 text-red-800 border border-red-200'
                                        : 'bg-white text-gray-800 border'
                                }
              `}
                        >
                            <div className="flex items-start space-x-2">
                                {message.type === 'bot' && (
                                    <Bot className={`h-4 w-4 mt-1 shrink-0 ${ message.error ? 'text-red-500' : 'text-blue-500'
                                        }`} />
                                )}
                                {message.type === 'user' && (
                                    <User className="h-4 w-4 mt-1 text-white shrink-0" />
                                )}
                                <div className="flex-1">
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className={`text-xs mt-1 ${ message.type === 'user' ? 'text-blue-100' :
                                        message.error ? 'text-red-500' : 'text-gray-500'
                                        }`}>
                                        {formatTime( message.timestamp )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
                            <div className="flex items-center space-x-2">
                                <Bot className="h-4 w-4 text-blue-500" />
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!isCompleted && (
                <div className="border-t bg-white p-4">
                    <form onSubmit={handleSubmit} className="flex space-x-2">
                        <input
                            type="text"
                            value={currentInput}
                            onChange={( e ) => setCurrentInput( e.target.value )}
                            placeholder={currentPlaceholder ?
                                `Enter ...` :
                                'Type your response...'
                            }
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!currentInput.trim() || isLoading}
                            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </form>

                    {currentPlaceholder && (
                        <div className="mt-2 flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                                {currentPlaceholder.placeholder_type && (
                                    <span className="capitalize">{currentPlaceholder.placeholder_type} field</span>
                                )}
                            </p>
                            <p className="text-xs text-gray-500">
                                Type "skip" to leave this field empty
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Completion Status */}
            {isCompleted && (
                <div className="border-t bg-green-50 p-4">
                    <div className="flex items-center justify-center space-x-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Document completion ready!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiConversationalInterface;