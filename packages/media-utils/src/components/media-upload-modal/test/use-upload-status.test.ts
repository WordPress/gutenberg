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
			expect( result.current.uploadingFiles[ 0 ].status ).toBe(
				'uploading'
			);
			expect( result.current.uploadingFiles[ 1 ].name ).toBe( 'b.png' );
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

			const batchId = result.current.uploadingFiles[ 0 ].batchId;
			expect( batchId ).toBeTruthy();
			expect( result.current.uploadingFiles[ 1 ].batchId ).toBe(
				batchId
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
			let onFileChange: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];

			act( () => {
				( { onFileChange } = result.current.registerBatch( [
					createFile( 'a.png' ),
				] ) );
			} );

			act( () => {
				onFileChange( [ createBlobAttachment( 'a.png' ) ] );
			} );

			expect( result.current.uploadingFiles[ 0 ].status ).toBe(
				'uploading'
			);
			expect( result.current.allComplete ).toBe( false );
		} );

		it( 'should mark batch as uploaded when all attachments have real URLs', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChange: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];

			act( () => {
				( { onFileChange } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			act( () => {
				onFileChange( [
					createAttachment( 1, 'a.png' ),
					createAttachment( 2, 'b.png' ),
				] );
			} );

			expect( result.current.uploadingFiles[ 0 ].status ).toBe(
				'uploaded'
			);
			expect( result.current.uploadingFiles[ 1 ].status ).toBe(
				'uploaded'
			);
			expect( result.current.allComplete ).toBe( true );
		} );

		it( 'should only mark its own batch as uploaded, not other batches', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChangeA: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];
			let onFileChangeB: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];

			act( () => {
				( { onFileChange: onFileChangeA } =
					result.current.registerBatch( [ createFile( 'a.png' ) ] ) );
				( { onFileChange: onFileChangeB } =
					result.current.registerBatch( [ createFile( 'b.png' ) ] ) );
			} );

			// Complete batch A only.
			act( () => {
				onFileChangeA( [ createAttachment( 1, 'a.png' ) ] );
			} );

			expect( result.current.uploadingFiles[ 0 ].status ).toBe(
				'uploaded'
			);
			expect( result.current.uploadingFiles[ 1 ].status ).toBe(
				'uploading'
			);
			expect( result.current.allComplete ).toBe( false );

			// Now complete batch B.
			act( () => {
				onFileChangeB( [ createAttachment( 2, 'b.png' ) ] );
			} );

			expect( result.current.allComplete ).toBe( true );
		} );

		it( 'should call onBatchComplete exactly once even if onFileChange fires multiple times', () => {
			const onBatchComplete = jest.fn();
			const { result } = renderHook( () =>
				useUploadStatus( { onBatchComplete } )
			);
			let onFileChange: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];

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
			// When window.__clientSideMediaProcessing is true, blob URLs
			// are not created. onFileChange is called with a growing array
			// as each file completes: [att1], [att1, att2], [att1, att2, att3].
			// The success count must not double-count overlapping entries.
			const onBatchComplete = jest.fn();
			const { result } = renderHook( () =>
				useUploadStatus( { onBatchComplete } )
			);
			let onFileChange: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];

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

			// File 1 completes.
			act( () => {
				onFileChange( [ att1 ] );
			} );

			expect( onBatchComplete ).not.toHaveBeenCalled();
			expect( result.current.allComplete ).toBe( false );

			// File 2 completes.
			act( () => {
				onFileChange( [ att1, att2 ] );
			} );

			expect( onBatchComplete ).not.toHaveBeenCalled();
			expect( result.current.allComplete ).toBe( false );

			// File 3 completes — batch should now be done.
			act( () => {
				onFileChange( [ att1, att2, att3 ] );
			} );

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
			let onError: ReturnType<
				typeof result.current.registerBatch
			>[ 'onError' ];

			act( () => {
				( { onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			act( () => {
				const file = createFile( 'a.png' );
				onError(
					new UploadError( {
						code: 'GENERAL',
						message: 'Upload failed',
						file,
					} )
				);
			} );

			expect( result.current.uploadingFiles[ 0 ].status ).toBe( 'error' );
			expect( result.current.uploadingFiles[ 0 ].error ).toBe(
				'Upload failed'
			);
			expect( result.current.uploadingFiles[ 1 ].status ).toBe(
				'uploading'
			);
		} );

		it( 'should only mark one file per error even with duplicate names in the same batch', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onError: ReturnType<
				typeof result.current.registerBatch
			>[ 'onError' ];

			act( () => {
				( { onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'a.png' ),
				] ) );
			} );

			act( () => {
				onError(
					new UploadError( {
						code: 'GENERAL',
						message: 'Upload failed',
						file: createFile( 'a.png' ),
					} )
				);
			} );

			const statuses = result.current.uploadingFiles.map(
				( item ) => item.status
			);
			expect( statuses ).toEqual( [ 'error', 'uploading' ] );
		} );

		it( 'should not affect files in a different batch', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onErrorB: ReturnType<
				typeof result.current.registerBatch
			>[ 'onError' ];

			act( () => {
				result.current.registerBatch( [ createFile( 'a.png' ) ] );
				( { onError: onErrorB } = result.current.registerBatch( [
					createFile( 'a.png' ),
				] ) );
			} );

			// Error targets batch B's file, not batch A's.
			act( () => {
				onErrorB(
					new UploadError( {
						code: 'GENERAL',
						message: 'Upload failed',
						file: createFile( 'a.png' ),
					} )
				);
			} );

			expect( result.current.uploadingFiles[ 0 ].status ).toBe(
				'uploading'
			);
			expect( result.current.uploadingFiles[ 1 ].status ).toBe( 'error' );
		} );
	} );

	describe( 'allComplete', () => {
		it( 'should be false when there are no files', () => {
			const { result } = renderHook( () => useUploadStatus() );
			expect( result.current.allComplete ).toBe( false );
		} );

		it( 'should be false when some files are still uploading', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChangeA: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];

			act( () => {
				( { onFileChange: onFileChangeA } =
					result.current.registerBatch( [ createFile( 'a.png' ) ] ) );
				result.current.registerBatch( [ createFile( 'b.png' ) ] );
			} );

			act( () => {
				onFileChangeA( [ createAttachment( 1, 'a.png' ) ] );
			} );

			expect( result.current.allComplete ).toBe( false );
		} );

		it( 'should be true when all files are uploaded or errored', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChange: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];
			let onError: ReturnType<
				typeof result.current.registerBatch
			>[ 'onError' ];

			act( () => {
				( { onFileChange, onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			act( () => {
				onError(
					new UploadError( {
						code: 'GENERAL',
						message: 'fail',
						file: createFile( 'a.png' ),
					} )
				);
			} );

			// One errored, one still uploading.
			expect( result.current.allComplete ).toBe( false );

			// Complete the remaining file — onFileChange fires with just
			// the successful attachment (failed ones are filtered as null
			// by uploadMedia).
			act( () => {
				onFileChange( [ createAttachment( 2, 'b.png' ) ] );
			} );

			expect( result.current.allComplete ).toBe( true );
		} );
	} );

	describe( 'mixed success and error (uploadMedia race condition)', () => {
		it( 'should handle onFileChange firing before onError for a failed file', () => {
			// Simulates the uploadMedia flow for 3 files where c.png fails:
			// 1. Blob URLs created for all 3 (ignored by hook)
			// 2. a.png succeeds: onFileChange([a, blob:b, blob:c]) — has blobs, ignored
			// 3. b.png succeeds: onFileChange([a, b, blob:c]) — has blobs, ignored
			// 4. c.png fails: setAndUpdateFiles(2, null) triggers
			//    onFileChange([a, b]) — 2 real URLs, resolvedCount += 2
			// 5. onError(c.png) — marks c.png as error, resolvedCount += 1
			// 6. resolvedCount (3) >= batchSize (3) — batch complete
			const onBatchComplete = jest.fn();
			const { result } = renderHook( () =>
				useUploadStatus( { onBatchComplete } )
			);
			let onFileChange: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];
			let onError: ReturnType<
				typeof result.current.registerBatch
			>[ 'onError' ];

			act( () => {
				( { onFileChange, onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
					createFile( 'c.png' ),
				] ) );
			} );

			// Steps 1-3: blob URL calls and partial completions (ignored).
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

			// Step 4: c.png fails — onFileChange fires with nulls filtered
			// (only the 2 successful attachments).
			act( () => {
				onFileChange( [
					createAttachment( 1, 'a.png' ),
					createAttachment( 2, 'b.png' ),
				] );
			} );

			// resolvedCount is 2, batchSize is 3 — not done yet.
			expect( onBatchComplete ).not.toHaveBeenCalled();

			// Step 5: onError fires for c.png.
			act( () => {
				onError(
					new UploadError( {
						code: 'GENERAL',
						message: 'Upload failed',
						file: createFile( 'c.png' ),
					} )
				);
			} );

			// Now resolvedCount is 3 — batch complete.
			expect( onBatchComplete ).toHaveBeenCalledTimes( 1 );
			expect( onBatchComplete ).toHaveBeenCalledWith( [
				createAttachment( 1, 'a.png' ),
				createAttachment( 2, 'b.png' ),
			] );

			// c.png should be errored, a.png and b.png should be uploaded.
			const statuses = result.current.uploadingFiles.map( ( item ) => [
				item.name,
				item.status,
			] );
			expect( statuses ).toEqual( [
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
			let onFileChange: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];
			let onError: ReturnType<
				typeof result.current.registerBatch
			>[ 'onError' ];

			act( () => {
				( { onFileChange, onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			// Both fail: onFileChange fires with empty array (all nulls
			// filtered out), then onError fires for each.
			act( () => {
				onFileChange( [] );
				onError(
					new UploadError( {
						code: 'GENERAL',
						message: 'fail a',
						file: createFile( 'a.png' ),
					} )
				);
				onFileChange( [] );
				onError(
					new UploadError( {
						code: 'GENERAL',
						message: 'fail b',
						file: createFile( 'b.png' ),
					} )
				);
			} );

			// onBatchComplete should still fire (with empty attachments).
			expect( onBatchComplete ).toHaveBeenCalledTimes( 1 );
			expect( onBatchComplete ).toHaveBeenCalledWith( [] );

			const statuses = result.current.uploadingFiles.map(
				( item ) => item.status
			);
			expect( statuses ).toEqual( [ 'error', 'error' ] );
			expect( result.current.allComplete ).toBe( true );
		} );
	} );

	describe( 'dismissError', () => {
		it( 'should remove the errored file from the list', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onError: ReturnType<
				typeof result.current.registerBatch
			>[ 'onError' ];

			act( () => {
				( { onError } = result.current.registerBatch( [
					createFile( 'a.png' ),
					createFile( 'b.png' ),
				] ) );
			} );

			act( () => {
				onError(
					new UploadError( {
						code: 'GENERAL',
						message: 'fail',
						file: createFile( 'a.png' ),
					} )
				);
			} );

			const erroredFile = result.current.uploadingFiles.find(
				( item ) => item.status === 'error'
			)!;

			act( () => {
				result.current.dismissError( erroredFile.id );
			} );

			expect( result.current.uploadingFiles ).toHaveLength( 1 );
			expect( result.current.uploadingFiles[ 0 ].name ).toBe( 'b.png' );
		} );
	} );

	describe( 'clearCompleted', () => {
		it( 'should remove uploaded entries but keep uploading and errored ones', () => {
			const { result } = renderHook( () => useUploadStatus() );
			let onFileChangeA: ReturnType<
				typeof result.current.registerBatch
			>[ 'onFileChange' ];
			let onErrorB: ReturnType<
				typeof result.current.registerBatch
			>[ 'onError' ];

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
				onErrorB(
					new UploadError( {
						code: 'GENERAL',
						message: 'fail',
						file: createFile( 'b.png' ),
					} )
				);
			} );

			act( () => {
				result.current.clearCompleted();
			} );

			const remaining = result.current.uploadingFiles;
			expect( remaining ).toHaveLength( 2 );
			expect( remaining.map( ( item ) => item.status ) ).toEqual( [
				'error',
				'uploading',
			] );
		} );
	} );
} );
