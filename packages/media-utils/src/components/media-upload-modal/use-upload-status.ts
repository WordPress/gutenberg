/**
 * Hook for tracking media upload status with batch-scoped callbacks.
 *
 * This is a transitional layer that manually tracks upload progress using
 * local state. The @wordpress/upload-media package provides a Redux-based
 * store with richer capabilities (per-file progress, pause/resume, retry,
 * concurrency control, client-side processing). When the media upload modal
 * adopts @wordpress/upload-media, this hook can be replaced by selectors
 * from that store (getItems, isBatchUploaded, getItemProgress, etc.) while
 * keeping the same return interface.
 */

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import type { Attachment } from '../../utils/types';
import { UploadError } from '../../utils/upload-error';
import type { UploadingFile } from './upload-status-popover';

let idCounter = 0;
let batchIdCounter = 0;

interface RegisterBatchOptions {
	onBatchComplete?: ( attachments: Partial< Attachment >[] ) => void;
}

interface RegisterBatchResult {
	onFileChange: ( attachments: Partial< Attachment >[] ) => void;
	onError: ( error: Error ) => void;
}

interface UseUploadStatusReturn {
	/** Current list of all tracked files. */
	uploadingFiles: UploadingFile[];
	/**
	 * Register a new batch of files for tracking.
	 * Returns batch-scoped onFileChange and onError callbacks.
	 */
	registerBatch: (
		files: File[],
		options?: RegisterBatchOptions
	) => RegisterBatchResult;
	/** Remove a single error entry by file id. */
	dismissError: ( fileId: string ) => void;
	/** Remove all uploaded (completed) entries from the list. */
	clearCompleted: () => void;
	/** True when tracked entries exist but none are still uploading. */
	allComplete: boolean;
}

export function useUploadStatus(): UseUploadStatusReturn {
	const [ uploadingFiles, setUploadingFiles ] = useState< UploadingFile[] >(
		[]
	);

	const clearCompleted = useCallback( () => {
		setUploadingFiles( ( prev ) =>
			prev.filter( ( f ) => f.status !== 'uploaded' )
		);
	}, [] );

	const dismissError = useCallback( ( fileId: string ) => {
		setUploadingFiles( ( prev ) =>
			prev.filter( ( f ) => f.id !== fileId )
		);
	}, [] );

	const registerBatch = useCallback(
		(
			files: File[],
			options?: RegisterBatchOptions
		): RegisterBatchResult => {
			const batchId = String( ++batchIdCounter );
			const batchSize = files.length;

			const newEntries: UploadingFile[] = files.map( ( file ) => ( {
				id: String( ++idCounter ),
				batchId,
				name: file.name,
				status: 'uploading' as const,
			} ) );

			setUploadingFiles( ( prev ) => [ ...prev, ...newEntries ] );

			// Track successes and errors separately. onFileChange receives
			// the full current array each time (not incremental), so we
			// store the latest count rather than accumulating. The batch
			// is complete when successCount + errorCount >= batchSize.
			let successCount = 0;
			let errorCount = 0;
			let batchDone = false;
			let successAttachments: Partial< Attachment >[] = [];

			const completeBatchIfDone = () => {
				if ( batchDone || successCount + errorCount < batchSize ) {
					return;
				}

				batchDone = true;

				// Mark any remaining 'uploading' entries in this batch
				// as 'uploaded' (these are the successful ones).
				setUploadingFiles( ( prev ) =>
					prev.map( ( f ) =>
						f.batchId === batchId && f.status === 'uploading'
							? {
									...f,
									status: 'uploaded' as const,
							  }
							: f
					)
				);

				options?.onBatchComplete?.( successAttachments );
			};

			const onFileChange = ( attachments: Partial< Attachment >[] ) => {
				if ( batchDone ) {
					return;
				}

				// Ignore intermediate calls where some files still have
				// blob URLs (not yet uploaded to the server).
				const allReal = attachments.every(
					( attachment ) =>
						attachment.id &&
						attachment.url &&
						! isBlobURL( attachment.url )
				);

				if ( ! allReal ) {
					return;
				}

				// Store the latest success count and attachments.
				// onFileChange receives the full array each time, so
				// we replace rather than accumulate.
				successCount = attachments.length;
				successAttachments = attachments;

				completeBatchIfDone();
			};

			const onError = ( error: Error ) => {
				const fileName =
					error instanceof UploadError ? error.file.name : undefined;

				setUploadingFiles( ( prev ) => {
					let matched = false;
					return prev.map( ( f ) => {
						if (
							! matched &&
							f.batchId === batchId &&
							fileName &&
							f.name === fileName &&
							f.status === 'uploading'
						) {
							matched = true;
							return {
								...f,
								status: 'error' as const,
								error: error.message,
							};
						}
						return f;
					} );
				} );

				errorCount++;

				completeBatchIfDone();
			};

			return { onFileChange, onError };
		},
		[]
	);

	const allComplete =
		uploadingFiles.length > 0 &&
		uploadingFiles.every( ( f ) => f.status !== 'uploading' );

	return {
		uploadingFiles,
		registerBatch,
		dismissError,
		clearCompleted,
		allComplete,
	};
}
