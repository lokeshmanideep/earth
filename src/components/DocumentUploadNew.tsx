import { AlertCircle, CheckCircle, FileText, Upload } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import apiService from '../services/apiService';
import type { DocumentUploadResponse, UploadProgress } from '../types/api';

interface DocumentUploadProps
{
    onFileUpload: ( uploadResponse: DocumentUploadResponse ) => void;
    onError: ( error: string ) => void;
    isLoading?: boolean;
    error?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ( {
    onFileUpload,
    onError,
    isLoading,
    error
} ) =>
{
    const [ uploadProgress, setUploadProgress ] = useState<UploadProgress | null>( null );
    const [ validationErrors, setValidationErrors ] = useState<string[]>( [] );
    const [ isCompleted, setIsCompleted ] = useState( false );

    const onDrop = useCallback( async ( acceptedFiles: File[] ) =>
    {
        if ( acceptedFiles.length > 0 )
        {
            const file = acceptedFiles[ 0 ];

            // Clear previous validation errors
            setValidationErrors( [] );

            // Validate file before upload
            const validation = apiService.validateDocumentUpload( file );
            if ( !validation.isValid )
            {
                setValidationErrors( validation.errors );
                onError( validation.errors.join( '; ' ) );
                return;
            }

            try
            {
                // Reset progress
                setUploadProgress( { loaded: 0, total: file.size, percentage: 0 } );

                const response = await apiService.uploadDocument( file, ( progress ) =>
                {
                    setUploadProgress( progress );
                } );

                if ( response.success && response.data )
                {
                    setUploadProgress( { loaded: file.size, total: file.size, percentage: 100 } );
                    setIsCompleted( true );
                    onFileUpload( response.data );
                } else
                {
                    onError( response.error || 'Upload failed' );
                }
            } catch ( error )
            {
                const errorMessage = error instanceof Error ? error.message : 'Upload failed';
                onError( errorMessage );
            } finally
            {
                // Clear progress after a delay
                setTimeout( () =>
                {
                    setUploadProgress( null );
                    setIsCompleted( false );
                }, 2000 );
            }
        }
    }, [ onFileUpload, onError ] );

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone( {
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [ '.docx' ],
            'application/msword': [ '.doc' ]
        },
        maxFiles: 1,
        disabled: isLoading,
        maxSize: 10 * 1024 * 1024 // 10MB
    } );

    const hasRejectedFiles = fileRejections.length > 0;
    const hasValidationErrors = validationErrors.length > 0;
    const isUploading = isLoading || uploadProgress !== null;

    return (
        <div className="document-upload">
            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${ isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400' }
          ${ isUploading ? 'opacity-50 cursor-not-allowed' : '' }
          ${ hasRejectedFiles || error || hasValidationErrors ? 'border-red-300 bg-red-50' : '' }
        `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center space-y-4">
                    {isUploading ? (
                        <div className="flex flex-col items-center space-y-2">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            {uploadProgress && (
                                <div className="w-64">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Uploading...</span>
                                        <span>{uploadProgress.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${ uploadProgress.percentage }%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : isCompleted ? (
                        <>
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <p className="text-lg font-medium text-green-700">Upload successful!</p>
                        </>
                    ) : (
                        <>
                            {isDragActive ? (
                                <Upload className="h-12 w-12 text-blue-500" />
                            ) : (
                                <FileText className="h-12 w-12 text-gray-400" />
                            )}
                        </>
                    )}

                    {!isUploading && !isCompleted && (
                        <div>
                            <p className="text-lg font-medium text-gray-700">
                                {isDragActive
                                    ? 'Drop your document here'
                                    : 'Upload Legal Document'
                                }
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Drag & drop a .docx or .doc file here, or click to browse
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Maximum file size: 10MB
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* File Rejection Errors */}
            {hasRejectedFiles && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                            <p className="text-sm text-red-700 font-medium">File Upload Error</p>
                            {fileRejections.map( ( rejection, index ) => (
                                <div key={index}>
                                    <p className="text-xs text-red-600">{rejection.file.name}</p>
                                    <ul className="text-xs text-red-600 list-disc list-inside">
                                        {rejection.errors.map( ( error, errorIndex ) => (
                                            <li key={errorIndex}>{error.message}</li>
                                        ) )}
                                    </ul>
                                </div>
                            ) )}
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Errors */}
            {hasValidationErrors && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                            <p className="text-sm text-red-700 font-medium">Validation Error</p>
                            <ul className="text-xs text-red-600 list-disc list-inside mt-1">
                                {validationErrors.map( ( error, index ) => (
                                    <li key={index}>{error}</li>
                                ) )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* General Error */}
            {error && !hasRejectedFiles && !hasValidationErrors && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* API Status */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                    Powered by Legal Document Processing API
                </p>
            </div>
        </div>
    );
};

export default DocumentUpload;