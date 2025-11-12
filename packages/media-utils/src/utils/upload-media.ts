/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { createBlobURL, revokeBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import type {
	AdditionalData,
	Attachment,
	OnChangeHandler,
	OnErrorHandler,
} from './types';
import { uploadToServer } from './upload-to-server';
import { validateMimeType } from './validate-mime-type';
import { validateMimeTypeForUser } from './validate-mime-type-for-user';
import { validateFileSize } from './validate-file-size';
import { UploadError } from './upload-error';

declare global {
	interface Window {
		__experimentalMediaProcessing?: boolean;
	}
}

interface UploadMediaArgs {
	// Additional data to include in the request.
	additionalData?: AdditionalData;
	// Array with the types of media that can be uploaded, if unset all types are allowed.
	allowedTypes?: string[];
	// List of files.
	filesList: File[];
	// Maximum upload size in bytes allowed for the site.
	maxUploadFileSize?: number;
	// Function called when an error happens.
	onError?: OnErrorHandler;
	// Function called each time a file or a temporary representation of the file is available.
	onFileChange?: OnChangeHandler;
	// List of allowed mime types and file extensions.
	wpAllowedMimeTypes?: Record< string, string > | null;
	// Abort signal.
	signal?: AbortSignal;
	// Whether to allow multiple files to be uploaded.
	multiple?: boolean;
}

/**
 * Upload a media file when the file upload button is activated
 * or when adding a file to the editor via drag & drop.
 *
 * @param $0                    Parameters object passed to the function.
 * @param $0.allowedTypes       Array with the types of media that can be uploaded, if unset all types are allowed.
 * @param $0.additionalData     Additional data to include in the request.
 * @param $0.filesList          List of files.
 * @param $0.maxUploadFileSize  Maximum upload size in bytes allowed for the site.
 * @param $0.onError            Function called when an error happens.
 * @param $0.onFileChange       Function called each time a file or a temporary representation of the file is available.
 * @param $0.wpAllowedMimeTypes List of allowed mime types and file extensions.
 * @param $0.signal             Abort signal.
 * @param $0.multiple           Whether to allow multiple files to be uploaded.
 */
export function uploadMedia( {
	wpAllowedMimeTypes,
	allowedTypes,
	additionalData = {},
	filesList,
	maxUploadFileSize,
	onError,
	onFileChange,
	signal,
	multiple = true,
}: UploadMediaArgs ) {
	if ( ! multiple && filesList.length > 1 ) {
		onError?.( new Error( __( 'Only one file can be used here.' ) ) );
		return;
	}

	const validFiles = [];

	const filesSet: Array< Partial< Attachment > | null > = [];
	const setAndUpdateFiles = ( index: number, value: Attachment | null ) => {
		// For client-side media processing, this is handled by the upload-media package.
		if ( ! window.__experimentalMediaProcessing ) {
			if ( filesSet[ index ]?.url ) {
				revokeBlobURL( filesSet[ index ].url );
			}
		}
		filesSet[ index ] = value;
		onFileChange?.(
			filesSet.filter( ( attachment ) => attachment !== null )
		);
	};

	for ( const mediaFile of filesList ) {
		// Verify if user is allowed to upload this mime type.
		// Defer to the server when type not detected.
		try {
			validateMimeTypeForUser( mediaFile, wpAllowedMimeTypes );
		} catch ( error: unknown ) {
			onError?.( error as Error );
			continue;
		}

		// Check if the caller (e.g. a block) supports this mime type.
		// Defer to the server when type not detected.
		try {
			validateMimeType( mediaFile, allowedTypes );
		} catch ( error: unknown ) {
			onError?.( error as Error );
			continue;
		}

		// Verify if file is greater than the maximum file upload size allowed for the site.
		try {
			validateFileSize( mediaFile, maxUploadFileSize );
		} catch ( error: unknown ) {
			onError?.( error as Error );
			continue;
		}

		validFiles.push( mediaFile );

		// For client-side media processing, this is handled by the upload-media package.
		if ( ! window.__experimentalMediaProcessing ) {
			// Set temporary URL to create placeholder media file, this is replaced
			// with final file from media gallery when upload is `done` below.
			filesSet.push( { url: createBlobURL( mediaFile ) } );
			onFileChange?.( filesSet as Array< Partial< Attachment > > );
		}
	}

	validFiles.map( async ( file, index ) => {
		try {
			const attachment = await uploadToServer(
				file,
				additionalData,
				signal
			);
			setAndUpdateFiles( index, attachment );
		} catch ( error ) {
			// Reset to empty on failure.
			setAndUpdateFiles( index, null );

			// @wordpress/api-fetch throws any response that isn't in the 200 range as-is.
			let message: string;
			if (
				typeof error === 'object' &&
				error !== null &&
				'message' in error
			) {
				message =
					typeof error.message === 'string'
						? error.message
						: String( error.message );
			} else {
				message = sprintf(
					// translators: %s: file name
					__( 'Error while uploading file %s to the media library.' ),
					file.name
				);
			}

			onError?.(
				new UploadError( {
					code: 'GENERAL',
					message,
					file,
					cause: error instanceof Error ? error : undefined,
				} )
			);
		}
	} );
}
