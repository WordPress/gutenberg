import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	isUnsupportedConversionError,
	isSizeLimitConversionError,
	isConversionTimeoutError,
} from '../video-conversion';

describe( 'isUnsupportedConversionError', () => {
	// These are the exact messages thrown by @wordpress/video-conversion's
	// convertGifToVideo (see packages/video-conversion/src/index.ts). They
	// are duplicated here intentionally: the worker RPC layer (comctx)
	// serializes a thrown error to its message string only, so the
	// cross-boundary contract is the message prefix. If the worker wording
	// drifts without updating this guard, this test fails.
	it.each( [
		'Unsupported: WebCodecs unavailable',
		'Unsupported: encoder codec not supported',
		'Unsupported: GIF exceeds maximum conversion size (5000x5000 x 100 frames = 2500000000 pixels; limit is 300000000)',
	] )( 'recognizes graceful outcome: %s', ( message ) => {
		expect( isUnsupportedConversionError( new Error( message ) ) ).toBe(
			true
		);
	} );

	it( 'treats a real failure as non-graceful', () => {
		expect(
			isUnsupportedConversionError(
				new Error( 'Encoder produced empty output' )
			)
		).toBe( false );
	} );

	it( 'treats a non-Error value as non-graceful', () => {
		expect( isUnsupportedConversionError( 'Unsupported' ) ).toBe( false );
		expect( isUnsupportedConversionError( undefined ) ).toBe( false );
	} );
} );

describe( 'isSizeLimitConversionError', () => {
	it( 'recognizes the size-limit message thrown by the worker (contract)', () => {
		// Exact wording thrown by @wordpress/video-conversion when the
		// total-pixel budget is exceeded; duplicated here because the worker
		// boundary only carries the message string.
		const error = new Error(
			'Unsupported: GIF exceeds maximum conversion size (5000x5000 x 100 frames = 2500000000 pixels; limit is 300000000)'
		);
		expect( isSizeLimitConversionError( error ) ).toBe( true );
		// A size-limit skip is also a graceful "unsupported" outcome.
		expect( isUnsupportedConversionError( error ) ).toBe( true );
	} );

	it( 'does not match other unsupported outcomes', () => {
		expect(
			isSizeLimitConversionError(
				new Error( 'Unsupported: WebCodecs unavailable' )
			)
		).toBe( false );
		expect( isSizeLimitConversionError( undefined ) ).toBe( false );
	} );
} );

describe( 'isConversionTimeoutError', () => {
	it( 'recognizes the timeout error thrown by convertGifToVideo', () => {
		expect(
			isConversionTimeoutError(
				new Error( 'GIF to video conversion timed out after 30000ms' )
			)
		).toBe( true );
	} );

	it( 'does not match other errors', () => {
		expect(
			isConversionTimeoutError(
				new Error( 'Unsupported: WebCodecs unavailable' )
			)
		).toBe( false );
		expect( isConversionTimeoutError( 'timed out' ) ).toBe( false );
	} );
} );

/*
 * The remaining functions wrap the lazily-imported
 * @wordpress/video-conversion/worker module (mapped to a test stub by the
 * Vitest configuration). Each test starts from a fresh module registry so
 * the module-level "has the worker loaded yet?" state is deterministic.
 */
describe( 'convertGifToVideo', () => {
	beforeEach( () => {
		vi.resetModules();
	} );

	it( 'delegates to the worker and wraps mp4 output in a named File', async () => {
		const worker = await import( '@wordpress/video-conversion/worker' );
		const buffer = new ArrayBuffer( 8 );
		vi.mocked( worker.convertGifToVideo ).mockResolvedValue( buffer );

		const { convertGifToVideo } = await import( '../video-conversion' );
		const gif = new File(
			[ new Uint8Array( [ 1, 2, 3 ] ) ],
			'my-anim.gif',
			{
				type: 'image/gif',
			}
		);

		const result = await convertGifToVideo( 'item-1', gif, 'video/mp4', {
			maxDimensions: 720,
		} );

		/*
		 * The original File (not an ArrayBuffer) is passed straight through so
		 * the worker reads its bytes off the main thread.
		 */
		expect( worker.convertGifToVideo ).toHaveBeenCalledWith(
			'item-1',
			gif,
			'video/mp4',
			720,
			undefined
		);
		expect( result ).toBeInstanceOf( File );
		expect( result.name ).toBe( 'my-anim.mp4' );
		expect( result.type ).toBe( 'video/mp4' );
	} );

	it( 'uses a .webm extension for webm output', async () => {
		const worker = await import( '@wordpress/video-conversion/worker' );
		vi.mocked( worker.convertGifToVideo ).mockResolvedValue(
			new ArrayBuffer( 4 )
		);

		const { convertGifToVideo } = await import( '../video-conversion' );
		const gif = new File( [ new Uint8Array( [ 0 ] ) ], 'clip.gif', {
			type: 'image/gif',
		} );

		const result = await convertGifToVideo( 'item-2', gif, 'video/webm' );

		expect( worker.convertGifToVideo ).toHaveBeenCalledWith(
			'item-2',
			gif,
			'video/webm',
			undefined,
			undefined
		);
		expect( result.name ).toBe( 'clip.webm' );
		expect( result.type ).toBe( 'video/webm' );
	} );

	it( 'defaults to a .mp4 extension for any non-webm output type', async () => {
		const worker = await import( '@wordpress/video-conversion/worker' );
		vi.mocked( worker.convertGifToVideo ).mockResolvedValue(
			new ArrayBuffer( 4 )
		);

		const { convertGifToVideo } = await import( '../video-conversion' );
		const gif = new File( [ new Uint8Array( [ 0 ] ) ], 'clip.gif', {
			type: 'image/gif',
		} );

		const result = await convertGifToVideo(
			'item-3',
			gif,
			'video/quicktime'
		);

		expect( result.name ).toBe( 'clip.mp4' );
	} );
} );

describe( 'convertGifToVideo timeout', () => {
	let worker: typeof import('@wordpress/video-conversion/worker');
	let convertGifToVideo: typeof import('../video-conversion').convertGifToVideo;

	beforeEach( async () => {
		vi.resetModules();

		/*
		 * Resolve the production module's lazy worker import before switching
		 * to fake timers. Vitest's module loader schedules work through the
		 * real event loop, so awaiting the first import while timers are faked
		 * would make the test race the loader rather than the conversion timer
		 * under test.
		 */
		worker = await import( '@wordpress/video-conversion/worker' );
		vi.mocked( worker.convertGifToVideo ).mockResolvedValue(
			new ArrayBuffer( 0 )
		);
		( { convertGifToVideo } = await import( '../video-conversion' ) );
		await convertGifToVideo( 'warmup', makeGif(), 'video/mp4', {
			timeout: 0,
		} );

		vi.clearAllMocks();
		vi.useFakeTimers();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	function makeGif() {
		return new File( [ new Uint8Array( [ 0 ] ) ], 'anim.gif', {
			type: 'image/gif',
		} );
	}

	async function waitForWorkerCall(
		workerModule: typeof import('@wordpress/video-conversion/worker')
	) {
		for (
			let attempts = 0;
			attempts < 10 &&
			! vi.mocked( workerModule.convertGifToVideo ).mock.calls.length;
			attempts++
		) {
			await Promise.resolve();
		}
		expect( workerModule.convertGifToVideo ).toHaveBeenCalled();
	}

	it( 'abandons a conversion that exceeds the default 30s timeout and cancels the worker', async () => {
		// A conversion that never settles, like a huge GIF churning away.
		vi.mocked( worker.convertGifToVideo ).mockReturnValue(
			new Promise( () => {} )
		);
		vi.mocked( worker.cancelGifToVideoOperations ).mockResolvedValue(
			true
		);

		const promise = convertGifToVideo( 'item-1', makeGif(), 'video/mp4' );
		// Attach a handler before advancing time so the rejection is never
		// reported as unhandled.
		promise.catch( () => {} );
		await waitForWorkerCall( worker );

		vi.advanceTimersByTime( 30_000 );

		// The exact message is the isConversionTimeoutError contract.
		await expect( promise ).rejects.toThrow(
			'GIF to video conversion timed out after 30000ms'
		);
		// The worker-side operation was cancelled so it stops churning at
		// its next async boundary.
		expect( worker.cancelGifToVideoOperations ).toHaveBeenCalledWith(
			'item-1'
		);
	} );

	it( 'does not time out a conversion that finishes in time', async () => {
		vi.mocked( worker.convertGifToVideo ).mockResolvedValue(
			new ArrayBuffer( 4 )
		);

		const promise = convertGifToVideo( 'item-2', makeGif(), 'video/mp4' );
		await waitForWorkerCall( worker );
		vi.advanceTimersByTime( 0 );
		const result = await promise;

		expect( result ).toBeInstanceOf( File );
		expect( worker.cancelGifToVideoOperations ).not.toHaveBeenCalled();
		// The timeout timer was cleared; nothing left pending.
		expect( vi.getTimerCount() ).toBe( 0 );
	} );

	it( 'honors a custom timeout', async () => {
		vi.mocked( worker.convertGifToVideo ).mockReturnValue(
			new Promise( () => {} )
		);
		vi.mocked( worker.cancelGifToVideoOperations ).mockResolvedValue(
			true
		);

		const promise = convertGifToVideo( 'item-3', makeGif(), 'video/mp4', {
			timeout: 5_000,
		} );
		promise.catch( () => {} );
		await waitForWorkerCall( worker );

		vi.advanceTimersByTime( 5_000 );

		await expect( promise ).rejects.toThrow( /timed out/i );
	} );

	it( 'treats a timeout of 0 as disabled', async () => {
		let resolveConversion: ( buffer: ArrayBuffer ) => void = () => {};
		vi.mocked( worker.convertGifToVideo ).mockReturnValue(
			new Promise( ( resolve ) => {
				resolveConversion = resolve;
			} )
		);

		const promise = convertGifToVideo( 'item-4', makeGif(), 'video/mp4', {
			timeout: 0,
		} );
		await waitForWorkerCall( worker );

		// Way past the default timeout: nothing should reject because no
		// timer was ever set.
		vi.advanceTimersByTime( 120_000 );
		expect( vi.getTimerCount() ).toBe( 0 );

		resolveConversion( new ArrayBuffer( 4 ) );
		const result = await promise;
		expect( result ).toBeInstanceOf( File );
		expect( worker.cancelGifToVideoOperations ).not.toHaveBeenCalled();
	} );
} );

describe( 'cancelGifToVideoOperations', () => {
	beforeEach( () => {
		vi.resetModules();
	} );

	it( 'returns false when the worker module has not been loaded yet', async () => {
		const worker = await import( '@wordpress/video-conversion/worker' );
		const { cancelGifToVideoOperations } = await import(
			'../video-conversion'
		);

		await expect( cancelGifToVideoOperations( 'item-1' ) ).resolves.toBe(
			false
		);
		expect( worker.cancelGifToVideoOperations ).not.toHaveBeenCalled();
	} );

	it( 'delegates to the worker once the module is loaded', async () => {
		const worker = await import( '@wordpress/video-conversion/worker' );
		vi.mocked( worker.convertGifToVideo ).mockResolvedValue(
			new ArrayBuffer( 4 )
		);
		vi.mocked( worker.cancelGifToVideoOperations ).mockResolvedValue(
			true
		);

		const { convertGifToVideo, cancelGifToVideoOperations } = await import(
			'../video-conversion'
		);

		// Trigger a conversion to lazily load (and cache) the worker module.
		await convertGifToVideo(
			'item-1',
			new File( [ new Uint8Array( [ 0 ] ) ], 'a.gif', {
				type: 'image/gif',
			} ),
			'video/mp4'
		);

		await expect( cancelGifToVideoOperations( 'item-1' ) ).resolves.toBe(
			true
		);
		expect( worker.cancelGifToVideoOperations ).toHaveBeenCalledWith(
			'item-1'
		);
	} );

	it( 'delegates a cancel issued while the worker is still loading', async () => {
		const worker = await import( '@wordpress/video-conversion/worker' );
		vi.mocked( worker.convertGifToVideo ).mockResolvedValue(
			new ArrayBuffer( 4 )
		);
		vi.mocked( worker.cancelGifToVideoOperations ).mockResolvedValue(
			true
		);

		const { convertGifToVideo, cancelGifToVideoOperations } = await import(
			'../video-conversion'
		);

		/*
		 * Start a conversion but do NOT await it: the worker module is now
		 * loading (the import promise is set, the module is not yet resolved).
		 * A cancel issued in this window must still reach the worker.
		 */
		const conversion = convertGifToVideo(
			'item-1',
			new File( [ new Uint8Array( [ 0 ] ) ], 'a.gif', {
				type: 'image/gif',
			} ),
			'video/mp4'
		);

		await expect( cancelGifToVideoOperations( 'item-1' ) ).resolves.toBe(
			true
		);
		expect( worker.cancelGifToVideoOperations ).toHaveBeenCalledWith(
			'item-1'
		);

		await conversion;
	} );
} );

describe( 'terminateVideoConversionWorker', () => {
	beforeEach( () => {
		vi.resetModules();
	} );

	it( 'is a no-op when the worker module has not been loaded yet', async () => {
		const worker = await import( '@wordpress/video-conversion/worker' );
		const { terminateVideoConversionWorker } = await import(
			'../video-conversion'
		);

		expect( () => terminateVideoConversionWorker() ).not.toThrow();
		expect( worker.terminateVideoConversionWorker ).not.toHaveBeenCalled();
	} );

	it( 'terminates the worker once the module is loaded', async () => {
		const worker = await import( '@wordpress/video-conversion/worker' );
		vi.mocked( worker.convertGifToVideo ).mockResolvedValue(
			new ArrayBuffer( 4 )
		);

		const { convertGifToVideo, terminateVideoConversionWorker } =
			await import( '../video-conversion' );

		await convertGifToVideo(
			'item-1',
			new File( [ new Uint8Array( [ 0 ] ) ], 'a.gif', {
				type: 'image/gif',
			} ),
			'video/mp4'
		);

		terminateVideoConversionWorker();
		expect( worker.terminateVideoConversionWorker ).toHaveBeenCalledTimes(
			1
		);
	} );
} );
