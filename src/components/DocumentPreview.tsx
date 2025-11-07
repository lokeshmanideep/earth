import { Download, Eye, EyeOff, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Placeholder } from '../services/documentParser';
import documentParser from '../services/documentParser';
import type { Progress } from '../types/api';

interface DocumentPreviewProps
{
    originalContent: string;
    placeholders: Placeholder[];
    onDownload: () => void;
    isGeneratingDownload?: boolean;
    progress: Progress;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ( {
    originalContent,
    placeholders,
    onDownload,
    isGeneratingDownload = false,
    progress
} ) =>
{
    const [ filledContent, setFilledContent ] = useState( '' );
    const [ showPlaceholders, setShowPlaceholders ] = useState( true );
    const [ isRefreshing, setIsRefreshing ] = useState( false );

    useEffect( () =>
    {
        updatePreview();
    }, [ originalContent, placeholders ] );

    const updatePreview = async () =>
    {
        setIsRefreshing( true );
        try
        {
            // Fill placeholders in the content
            const filled = documentParser.fillPlaceholders( originalContent, placeholders );
            setFilledContent( filled );
        } catch ( error )
        {
            console.error( 'Error updating preview:', error );
        } finally
        {
            setIsRefreshing( false );
        }
    };

    const getCompletionStats = () =>
    {
        const filled = progress.filled;
        const required = progress.total;
        const requiredFilled = progress.filled;

        return {
            totalFilled: filled,
            total: placeholders.length,
            requiredFilled,
            required,
            isComplete: requiredFilled === required && required > 0
        };
    };

    const stats = getCompletionStats();

    const highlightUnfilledPlaceholders = ( content: string ) =>
    {
        let highlightedContent = content;

        placeholders.forEach( placeholder =>
        {
            if ( !placeholder.value || placeholder.value.trim() === '' )
            {
                const escapedOriginal = placeholder.originalText.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
                const regex = new RegExp( `(${ escapedOriginal })`, 'g' );
                highlightedContent = highlightedContent.replace(
                    regex,
                    `<span class="unfilled-placeholder" title="Unfilled: ${ placeholder.label }">$1</span>`
                );
            }
        } );

        return highlightedContent;
    };

    const displayContent = showPlaceholders ? highlightUnfilledPlaceholders( filledContent ) : filledContent;

    return (
        <div className="document-preview h-full flex flex-col">
            {/* Header */}
            <div className="border-b bg-white p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Document Preview</h3>
                        <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-600">
                                {stats.totalFilled}/{stats.total} fields filled
                            </span>
                            {stats.isComplete && (
                                <span className="text-sm text-green-600 font-medium">✓ Ready to download</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowPlaceholders( !showPlaceholders )}
                            className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            title={showPlaceholders ? 'Hide unfilled placeholders' : 'Show unfilled placeholders'}
                        >
                            {showPlaceholders ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span>{showPlaceholders ? 'Hide' : 'Show'} Placeholders</span>
                        </button>

                        <button
                            onClick={updatePreview}
                            disabled={isRefreshing}
                            className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                            title="Refresh preview"
                        >
                            <RefreshCw className={`h-4 w-4 ${ isRefreshing ? 'animate-spin' : '' }`} />
                            <span>Refresh</span>
                        </button>

                        <button
                            onClick={onDownload}
                            disabled={!stats.isComplete || isGeneratingDownload}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={!stats.isComplete ? 'Complete all required fields to download' : 'Download completed document'}
                        >
                            <Download className={`h-4 w-4 ${ isGeneratingDownload ? 'animate-bounce' : '' }`} />
                            <span>{isGeneratingDownload ? 'Generating...' : 'Download'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-100 px-4 py-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Completion Progress</span>
                    <span className="text-xs text-gray-600">{Math.round( ( stats.totalFilled / stats.total ) * 100 )}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${ ( stats.totalFilled / stats.total ) * 100 }%` }}
                    ></div>
                </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div
                        className="document-content prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: displayContent }}
                    />
                </div>
            </div>

            {/* Unfilled Placeholders Summary */}
            {showPlaceholders && (
                <div className="border-t bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Unfilled Fields</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {placeholders
                            .filter( p => !p.value || p.value.trim() === '' )
                            .map( placeholder => (
                                <div
                                    key={placeholder.id}
                                    className={`text-xs px-2 py-1 rounded border ${ placeholder.required
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                        }`}
                                >
                                    <span className="font-medium">{placeholder.label}</span>
                                    {placeholder.required && <span className="ml-1">*</span>}
                                </div>
                            ) )
                        }
                    </div>
                    {placeholders.filter( p => !p.value || p.value.trim() === '' ).length === 0 && (
                        <p className="text-sm text-green-600">🎉 All fields have been filled!</p>
                    )}
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
          .unfilled-placeholder {
            background-color: #fef3c7;
            border: 1px dashed #f59e0b;
            padding: 2px 4px;
            border-radius: 4px;
            cursor: help;
          }
          
          .document-content p {
            margin-bottom: 1rem;
            line-height: 1.6;
          }
          
          .document-content h1, .document-content h2, .document-content h3 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: bold;
          }
          
          .document-content h1 {
            font-size: 1.5rem;
          }
          
          .document-content h2 {
            font-size: 1.25rem;
          }
          
          .document-content h3 {
            font-size: 1.125rem;
          }
          
          .document-content ul, .document-content ol {
            margin-bottom: 1rem;
            padding-left: 2rem;
          }
          
          .document-content li {
            margin-bottom: 0.5rem;
          }
        `
            }} />
        </div>
    );
};

export default DocumentPreview;