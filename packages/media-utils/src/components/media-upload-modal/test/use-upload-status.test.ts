/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useUploadStatus } from '../use-upload-status';
import { UploadError } from '../../../utils/upload-error';

function createFile( name: string ): File {
	return new File( [ 'content' ], name, { type: 'image/png' } );
}

function createAttachment( id: number, name: string ) {
	return { id, url: `https://example.com/${ name }` };
}

function createBlobAttachment( name: string ) {
	return { url: `blob:https://example.com/${ name }` };
}

function createUploadError( name: string, message = 'Upload failed' ) {
	return new UploadError( {
		code: 'GENERAL',
		message,
		file: createFile( name ),
	} );
}

function statuses( result: ReturnType< typeof useUploadStatus > ): string[] {
	return result.uploadingFiles.map( ( item ) => item.status );
}

type BatchCallbacks = ReturnType<
	ReturnType< typeof useUploadStatus >[ 'registerBatch' ]
>;

// isBlobURL from @wordpress/blob checks for the "blob:" prefix.
jest.mock( '@wordpress/blob', () => ( {
	isBlobURL: ( url: string ) => url.startsWith( 'blob:' ),
} ) );

describe( 'useUploadStatus', () => {
	it( 'should start with empty state', () => {
		const { result } = renderHook( () => useUploadStatus() );

		expect( result.current.uploadingFiles ).toEqual( [] );
		expect( result.current.allComplete ).toBe( false );
	} );

	describe( 'registerBatch', () => {
		it( 'should add files with uploading status', () => {
			const { result } = renderHook( () => useUploadStatus() );

			act( () => {
				result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] );
			} );

			expect( result.current.uploadingFiles ).toHaveLength( 2 );
			expect( result.current.uploadingFiles[ 0 ].name ).toBe( 'a.png' );
			expect( statuses( result.current ) ).toEqual( [
				'uploading',
				'uploading',
			] );
			expect( result.current.allComplete ).toBe( false );
		} );

		it( 'should assign the same batchId to files in a batch', () => {
			const { result } = renderHook( () => useUploadStatus() );

			act( () => {
				result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] );
			} );

			const { uploadingFiles } = result.current;
			expect( uploadingFiles[ 0 ].batchId ).toBeTruthy();
			expect( uploadingFiles[ 0 ].batchId ).toBe(
				uploadingFiles[ 1 ].batchId
			);
		} );

		it( 'should assign different batchIds to separate batches', () => {
			const { result } = renderHook( () => useUploadStatus() );

			act( () => {
				result.current.registerBatch( [ createFile( 'a.png' ) ] );
				result.current.registerBatch( [ createFile( 'b.png' ) ] );
			} );

			expect( result.current.uploadingFiles[ 0 ].batchId ).not.toBe(
				result.current.uploadingFiles[ 1 ].batchId
			);
		} );
	} );

	describe( 'onFileChange (batch completion)', () => {
		it( 'should ignore calls with blob URLs', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChange!: BatchCallbacks[ 'onFileChange' ];

			act( () => {
				( { onFileChange } = result.current.registerBatch( [
					createFile( 'a.png' ),
				] ) );
			} );

			act( () => onFileChange( [ createBlobAttachment( 'a.png' ) ] ) );

			expect( statuses( result.current ) ).toEqual( [ 'uploading' ] );
			expect( result.current.allComplete ).toBe( false );
		} );

		it( 'should mark batch as uploaded when all attachments have real URLs', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChange!: BatchCallbacks[ 'onFileChange' ];

			act( () => {
				( { onFileChange } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			act( () =>
				onFileChange( [
					createAttachment( 1, 'a.png' ),
					createAttachment( 2, 'b.png' ),
				] )
			);

			expect( statuses( result.current ) ).toEqual( [
				'uploaded',
				'uploaded',
			] );
			expect( result.current.allComplete ).toBe( true );
		} );

		it( 'should only mark its own batch as uploaded, not other batches', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChangeA!: BatchCallbacks[ 'onFileChange' ];
			let onFileChangeB!: BatchCallbacks[ 'onFileChange' ];

			act( () => {
				( { onFileChange: onFileChangeA } =
					result.current.registerBatch( [ createFile( 'a.png' ) ] ) );
				( { onFileChange: onFileChangeB } =
					result.current.registerBatch( [ createFile( 'b.png' ) ] ) );
			} );

			act( () => onFileChangeA( [ createAttachment( 1, 'a.png' ) ] ) );

			expect( statuses( result.current ) ).toEqual( [
				'uploaded',
				'uploading',
			] );
			expect( result.current.allComplete ).toBe( false );

			act( () => onFileChangeB( [ createAttachment( 2, 'b.png' ) ] ) );

			expect( result.current.allComplete ).toBe( true );
		} );

		it( 'should call onBatchComplete exactly once even if onFileChange fires multiple times', () => {
			const onBatchComplete = jest.fn();
			const { result } = renderHook( () =>
				useUploadStatus( { onBatchComplete } )
			);
			let onFileChange!: BatchCallbacks[ 'onFileChange' ];

			act( () => {
				( { onFileChange } = result.current.registerBatch( [
					createFile( 'a.png' ),
				] ) );
			} );

			const attachment = createAttachment( 1, 'a.png' );

			act( () => {
				onFileChange( [ attachment ] );
				onFileChange( [ attachment ] );
				onFileChange( [ attachment ] );
			} );

			expect( onBatchComplete ).toHaveBeenCalledTimes( 1 );
			expect( onBatchComplete ).toHaveBeenCalledWith( [ attachment ] );
		} );

		it( 'should handle onFileChange with growing arrays (no blob URLs)', () => {
			// When __clientSideMediaProcessing is true, blob URLs are not
			// created. onFileChange is called with a growing array as each
			// file completes: [att1], [att1, att2], [att1, att2, att3].
			const onBatchComplete = jest.fn();
			const { result } = renderHook( () =>
				useUploadStatus( { onBatchComplete } )
			);
			let onFileChange!: BatchCallbacks[ 'onFileChange' ];

			act( () => {
				( { onFileChange } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
					createFile( 'c.png' ),
				] ) );
			} );

			const att1 = createAttachment( 1, 'a.png' );
			const att2 = createAttachment( 2, 'b.png' );
			const att3 = createAttachment( 3, 'c.png' );

			act( () => onFileChange( [ att1 ] ) );
			expect( onBatchComplete ).not.toHaveBeenCalled();

			act( () => onFileChange( [ att1, att2 ] ) );
			expect( onBatchComplete ).not.toHaveBeenCalled();

			act( () => onFileChange( [ att1, att2, att3 ] ) );
			expect( onBatchComplete ).toHaveBeenCalledTimes( 1 );
			expect( onBatchComplete ).toHaveBeenCalledWith( [
				att1,
				att2,
				att3,
			] );
			expect( result.current.allComplete ).toBe( true );
		} );
	} );

	describe( 'onError', () => {
		it( 'should mark the matching file in the batch as errored', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onError!: BatchCallbacks[ 'onError' ];

			act( () => {
				( { onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			act( () => onError( createUploadError( 'a.png' ) ) );

			expect( result.current.uploadingFiles[ 0 ].status ).toBe( 'error' );
			expect( result.current.uploadingFiles[ 0 ].error ).toBe(
				'Upload failed'
			);
			expect( result.current.uploadingFiles[ 1 ].status ).toBe(
				'uploading'
			);
		} );

		it( 'should only mark one file per error even with duplicate names', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onError!: BatchCallbacks[ 'onError' ];

			act( () => {
				( { onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'a.png' ),
				] ) );
			} );

			act( () => onError( createUploadError( 'a.png' ) ) );

			expect( statuses( result.current ) ).toEqual( [
				'error',
				'uploading',
			] );
		} );

		it( 'should not affect files in a different batch', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onErrorB!: BatchCallbacks[ 'onError' ];

			act( () => {
				result.current.registerBatch( [ createFile( 'a.png' ) ] );
				( { onError: onErrorB } = result.current.registerBatch( [
					createFile( 'a.png' ),
				] ) );
			} );

			act( () => onErrorB( createUploadError( 'a.png' ) ) );

			expect( statuses( result.current ) ).toEqual( [
				'uploading',
				'error',
			] );
		} );
	} );

	describe( 'allComplete', () => {
		it( 'should be false when there are no files', () => {
			const { result } = renderHook( () => useUploadStatus() );
			expect( result.current.allComplete ).toBe( false );
		} );

		it( 'should be false when some files are still uploading', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChangeA!: BatchCallbacks[ 'onFileChange' ];

			act( () => {
				( { onFileChange: onFileChangeA } =
					result.current.registerBatch( [ createFile( 'a.png' ) ] ) );
				result.current.registerBatch( [ createFile( 'b.png' ) ] );
			} );

			act( () => onFileChangeA( [ createAttachment( 1, 'a.png' ) ] ) );

			expect( result.current.allComplete ).toBe( false );
		} );

		it( 'should be true when all files are uploaded or errored', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChange!: BatchCallbacks[ 'onFileChange' ];
			let onError!: BatchCallbacks[ 'onError' ];

			act( () => {
				( { onFileChange, onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			act( () => onError( createUploadError( 'a.png', 'fail' ) ) );
			expect( result.current.allComplete ).toBe( false );

			// Complete the remaining file — onFileChange fires with just
			// the successful attachment.
			act( () => onFileChange( [ createAttachment( 2, 'b.png' ) ] ) );
			expect( result.current.allComplete ).toBe( true );
		} );
	} );

	describe( 'mixed success and error (uploadMedia race condition)', () => {
		it( 'should handle onFileChange firing before onError for a failed file', () => {
			// Simulates the uploadMedia flow for 3 files where c.png fails:
			// 1. Blob URLs created for all 3 (ignored by hook)
			// 2-3. Partial completions with blobs (ignored)
			// 4. c.png fails → onFileChange([a, b]), successCount = 2
			// 5. onError(c.png) → errorCount = 1, total = 3 = batchSize
			const onBatchComplete = jest.fn();
			const { result } = renderHook( () =>
				useUploadStatus( { onBatchComplete } )
			);
			let onFileChange!: BatchCallbacks[ 'onFileChange' ];
			let onError!: BatchCallbacks[ 'onError' ];

			act( () => {
				( { onFileChange, onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
					createFile( 'c.png' ),
				] ) );
			} );

			// Blob URL calls and partial completions (all ignored).
			act( () => {
				onFileChange( [
					createBlobAttachment( 'a' ),
					createBlobAttachment( 'b' ),
					createBlobAttachment( 'c' ),
				] );
				onFileChange( [
					createAttachment( 1, 'a.png' ),
					createBlobAttachment( 'b' ),
					createBlobAttachment( 'c' ),
				] );
				onFileChange( [
					createAttachment( 1, 'a.png' ),
					createAttachment( 2, 'b.png' ),
					createBlobAttachment( 'c' ),
				] );
			} );
			expect( onBatchComplete ).not.toHaveBeenCalled();

			// c.png fails — onFileChange with only successful attachments.
			act( () =>
				onFileChange( [
					createAttachment( 1, 'a.png' ),
					createAttachment( 2, 'b.png' ),
				] )
			);
			expect( onBatchComplete ).not.toHaveBeenCalled();

			// onError fires for c.png — batch now complete.
			act( () => onError( createUploadError( 'c.png' ) ) );

			expect( onBatchComplete ).toHaveBeenCalledTimes( 1 );
			expect( onBatchComplete ).toHaveBeenCalledWith( [
				createAttachment( 1, 'a.png' ),
				createAttachment( 2, 'b.png' ),
			] );

			const fileStatuses = result.current.uploadingFiles.map(
				( item ) => [ item.name, item.status ]
			);
			expect( fileStatuses ).toEqual( [
				[ 'a.png', 'uploaded' ],
				[ 'b.png', 'uploaded' ],
				[ 'c.png', 'error' ],
			] );
			expect( result.current.allComplete ).toBe( true );
		} );

		it( 'should handle all files erroring', () => {
			const onBatchComplete = jest.fn();
			const { result } = renderHook( () =>
				useUploadStatus( { onBatchComplete } )
			);
			let onFileChange!: BatchCallbacks[ 'onFileChange' ];
			let onError!: BatchCallbacks[ 'onError' ];

			act( () => {
				( { onFileChange, onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			act( () => {
				onFileChange( [] );
				onError( createUploadError( 'a.png', 'fail a' ) );
				onFileChange( [] );
				onError( createUploadError( 'b.png', 'fail b' ) );
			} );

			expect( onBatchComplete ).toHaveBeenCalledTimes( 1 );
			expect( onBatchComplete ).toHaveBeenCalledWith( [] );
			expect( statuses( result.current ) ).toEqual( [
				'error',
				'error',
			] );
			expect( result.current.allComplete ).toBe( true );
		} );
	} );

	describe( 'dismissError', () => {
		it( 'should remove the errored file from the list', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onError!: BatchCallbacks[ 'onError' ];

			act( () => {
				( { onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			act( () => onError( createUploadError( 'a.png', 'fail' ) ) );

			const erroredFile = result.current.uploadingFiles.find(
				( item ) => item.status === 'error'
			)!;

			act( () => result.current.dismissError( erroredFile.id ) );

			expect( result.current.uploadingFiles ).toHaveLength( 1 );
			expect( result.current.uploadingFiles[ 0 ].name ).toBe( 'b.png' );
		} );
	} );

	describe( 'clearCompleted', () => {
		it( 'should remove uploaded entries but keep uploading and errored ones', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChangeA!: BatchCallbacks[ 'onFileChange' ];
			let onErrorB!: BatchCallbacks[ 'onError' ];

			act( () => {
				( { onFileChange: onFileChangeA } =
					result.current.registerBatch( [ createFile( 'a.png' ) ] ) );
				( { onError: onErrorB } = result.current.registerBatch( [
					createFile( 'b.png' ),
				] ) );
				result.current.registerBatch( [ createFile( 'c.png' ) ] );
			} );

			// Complete batch A, error batch B, leave batch C uploading.
			act( () => {
				onFileChangeA( [ createAttachment( 1, 'a.png' ) ] );
				onErrorB( createUploadError( 'b.png', 'fail' ) );
			} );

			act( () => result.current.clearCompleted() );

			expect( statuses( result.current ) ).toEqual( [
				'error',
				'uploading',
			] );
		} );
	} );
} );
