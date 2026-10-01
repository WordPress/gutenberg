/**
 * Tests for the re-entrancy guard in `processItem`.
 *
 * Several callers dispatch `processItem` for an item that may already have an
 * operation in flight: `resumeQueue` walks the whole queue, and a finishing
 * child sideload pings its parent. Without a guard the same handler runs
 * twice, and because each run finishes the operation, two steps are shifted
 * off the pipeline so one of them is silently skipped.
 */
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
} from 'vitest';
import { createRegistry } from '@wordpress/data';
import { store as uploadStore } from '..';
import { ItemStatus, OperationType } from '../types';
import { unlock } from '../../lock-unlock';
import { vipsResizeImage } from '../utils';

type WPDataRegistry = ReturnType< typeof createRegistry >;

vi.mock(
	import( '@wordpress/blob' ),
	() =>
		( {
			createBlobURL: vi.fn( () => 'blob:foo' ),
			isBlobURL: vi.fn( ( str: string ) => str.startsWith( 'blob:' ) ),
			revokeBlobURL: vi.fn(),
		} ) as unknown as typeof import( '@wordpress/blob' )
);

vi.mock(
	import( '../utils' ),
	() =>
		( {
			vipsCancelOperations: vi.fn( () => Promise.resolve( true ) ),
			vipsResizeImage: vi.fn(),
			vipsRotateImage: vi.fn(),
			vipsHasTransparency: vi.fn( () => Promise.resolve( false ) ),
			vipsConvertImageFormat: vi.fn(),
			terminateVipsWorker: vi.fn(),
			maybeRecycleVipsWorker: vi.fn(),
		} ) as unknown as typeof import( '../utils' )
);

vi.mock( import( '../utils/video-conversion' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		convertGifToVideo: vi.fn(),
		cancelGifToVideoOperations: vi.fn( () => Promise.resolve( true ) ),
		terminateVideoConversionWorker: vi.fn(),
		isUnsupportedConversionError: actual.isUnsupportedConversionError,
	};
} );

const jpegFile = new File( [ 'foo' ], 'example.jpg', {
	lastModified: 1234567891,
	type: 'image/jpeg',
} );

const otherJpegFile = new File( [ 'bar' ], 'other.jpg', {
	lastModified: 1234567891,
	type: 'image/jpeg',
} );

/**
 * Returns a `mediaUpload` stand-in that never completes on its own.
 *
 * The number of calls is the number of times the Upload handler was started,
 * and the item stays in flight until the test invokes one of the callbacks.
 */
function createStalledMediaUpload() {
	return vi.fn();
}

describe( 'processItem re-entrancy', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( uploadStore );
	} );

	it( 'does not start the operation again while it is still in flight', async () => {
		const mediaUpload = createStalledMediaUpload();
		unlock( registry.dispatch( uploadStore ) ).updateSettings( {
			mediaUpload,
		} );

		// Adding the item starts the Upload operation, which never completes.
		await unlock( registry.dispatch( uploadStore ) ).addItem( {
			file: jpegFile,
			operations: [ OperationType.Upload, OperationType.Finalize ],
		} );

		const item = unlock(
			registry.select( uploadStore )
		).getAllItems()[ 0 ];
		expect( item.currentOperation ).toBe( OperationType.Upload );
		expect( mediaUpload ).toHaveBeenCalledTimes( 1 );

		// A second dispatch for the same item, as a finishing child sideload
		// or resumeQueue would do, must not start a second upload.
		await unlock( registry.dispatch( uploadStore ) ).processItem( item.id );

		expect( mediaUpload ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not skip a pipeline step when the item is processed twice', async () => {
		const mediaUpload = createStalledMediaUpload();
		// A single upload slot, so the item's own Upload step has to wait for
		// the slot the other item holds instead of starting right away.
		unlock( registry.dispatch( uploadStore ) ).updateSettings( {
			mediaUpload,
			maxConcurrentUploads: 1,
		} );

		await unlock( registry.dispatch( uploadStore ) ).addItem( {
			file: otherJpegFile,
			operations: [ OperationType.Upload ],
		} );

		let finishResize: ( file: File ) => void = () => {};
		( vipsResizeImage as Mock ).mockReturnValue(
			new Promise< File >( ( resolve ) => {
				finishResize = resolve;
			} )
		);

		const onSuccess = vi.fn();
		await unlock( registry.dispatch( uploadStore ) ).addItem( {
			file: jpegFile,
			onSuccess,
			operations: [
				[
					OperationType.ResizeCrop,
					{ resize: { width: 5, height: 5 } },
				],
				OperationType.Upload,
			],
		} );

		const item = unlock(
			registry.select( uploadStore )
		).getAllItems()[ 1 ];
		expect( item.currentOperation ).toBe( OperationType.ResizeCrop );

		// Re-enter while the resize is in flight.
		await unlock( registry.dispatch( uploadStore ) ).processItem( item.id );

		finishResize(
			new File( [ 'foo' ], 'example-5x5.jpg', { type: 'image/jpeg' } )
		);
		await vi.waitFor( () => {
			expect(
				unlock( registry.select( uploadStore ) ).getItem( item.id )
					?.currentOperation
			).toBeUndefined();
		} );

		/*
		 * Two concurrent resize runs both finish the operation, shifting the
		 * Upload step off the pipeline as well. The item is then treated as
		 * complete even though its file was never uploaded.
		 */
		const updatedItem = unlock( registry.select( uploadStore ) ).getItem(
			item.id
		);
		expect( updatedItem ).toBeDefined();
		expect( updatedItem?.operations ).toEqual( [ OperationType.Upload ] );
		expect( onSuccess ).not.toHaveBeenCalled();
	} );

	it( 'resumeQueue does not restart an operation that is still in flight', async () => {
		const mediaUpload = createStalledMediaUpload();
		unlock( registry.dispatch( uploadStore ) ).updateSettings( {
			mediaUpload,
		} );

		await unlock( registry.dispatch( uploadStore ) ).addItem( {
			file: jpegFile,
			operations: [ OperationType.Upload ],
		} );

		expect( mediaUpload ).toHaveBeenCalledTimes( 1 );

		// Pausing does not interrupt the in-flight handler, so resuming must
		// not start it a second time.
		unlock( registry.dispatch( uploadStore ) ).pauseQueue();
		await unlock( registry.dispatch( uploadStore ) ).resumeQueue();

		expect( mediaUpload ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'retries', () => {
		beforeEach( () => {
			vi.useFakeTimers();
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				retry: {
					maxRetryAttempts: 3,
					initialRetryDelayMs: 1000,
					maxRetryDelayMs: 30000,
					backoffMultiplier: 2,
					retryJitter: 0,
				},
			} );
		} );

		afterEach( () => {
			vi.useRealTimers();
		} );

		it( 'still retries an item parked in PendingRetry', async () => {
			// The first run fails with a retryable error; later runs stall.
			const mediaUpload = vi.fn(
				( { onError }: { onError: ( error: Error ) => void } ) => {
					if ( mediaUpload.mock.calls.length === 1 ) {
						onError( new Error( 'Network error' ) );
					}
				}
			);
			unlock( registry.dispatch( uploadStore ) ).updateSettings( {
				mediaUpload,
			} );

			await unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				operations: [ OperationType.Upload ],
				onError: () => {},
			} );

			const item = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( item.status ).toBe( ItemStatus.PendingRetry );

			await vi.runAllTimersAsync();

			const retriedItem = unlock(
				registry.select( uploadStore )
			).getAllItems()[ 0 ];
			expect( retriedItem.status ).toBe( ItemStatus.Processing );
			expect( retriedItem.retryCount ).toBe( 1 );
			expect( mediaUpload ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );
