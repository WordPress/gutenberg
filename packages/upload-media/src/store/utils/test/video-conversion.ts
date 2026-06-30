/**
 * Internal dependencies
 */
import { isUnsupportedConversionError } from '../video-conversion';

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

/*
 * The remaining functions wrap the lazily-imported
 * @wordpress/video-conversion/worker module (mapped to a jest stub via
 * moduleNameMapper). Each test starts from a fresh module registry so the
 * module-level "has the worker loaded yet?" state is deterministic.
 */
describe( 'convertGifToVideo', () => {
	beforeEach( () => {
		jest.resetModules();
	} );

	it( 'delegates to the worker and wraps mp4 output in a named File', async () => {
		const worker = require( '@wordpress/video-conversion/worker' );
		const buffer = new ArrayBuffer( 8 );
		worker.convertGifToVideo.mockResolvedValue( buffer );

		const { convertGifToVideo } = require( '../video-conversion' );
		const gif = new File(
			[ new Uint8Array( [ 1, 2, 3 ] ) ],
			'my-anim.gif',
			{
				type: 'image/gif',
			}
		);

		const result = await convertGifToVideo(
			'item-1',
			gif,
			'video/mp4',
			720
		);

		/*
		 * The original File (not an ArrayBuffer) is passed straight through so
		 * the worker reads its bytes off the main thread.
		 */
		expect( worker.convertGifToVideo ).toHaveBeenCalledWith(
			'item-1',
			gif,
			'video/mp4',
			720
		);
		expect( result ).toBeInstanceOf( File );
		expect( result.name ).toBe( 'my-anim.mp4' );
		expect( result.type ).toBe( 'video/mp4' );
	} );

	it( 'uses a .webm extension for webm output', async () => {
		const worker = require( '@wordpress/video-conversion/worker' );
		worker.convertGifToVideo.mockResolvedValue( new ArrayBuffer( 4 ) );

		const { convertGifToVideo } = require( '../video-conversion' );
		const gif = new File( [ new Uint8Array( [ 0 ] ) ], 'clip.gif', {
			type: 'image/gif',
		} );

		const result = await convertGifToVideo( 'item-2', gif, 'video/webm' );

		expect( worker.convertGifToVideo ).toHaveBeenCalledWith(
			'item-2',
			gif,
			'video/webm',
			undefined
		);
		expect( result.name ).toBe( 'clip.webm' );
		expect( result.type ).toBe( 'video/webm' );
	} );

	it( 'defaults to a .mp4 extension for any non-webm output type', async () => {
		const worker = require( '@wordpress/video-conversion/worker' );
		worker.convertGifToVideo.mockResolvedValue( new ArrayBuffer( 4 ) );

		const { convertGifToVideo } = require( '../video-conversion' );
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

describe( 'cancelGifToVideoOperations', () => {
	beforeEach( () => {
		jest.resetModules();
	} );

	it( 'returns false when the worker module has not been loaded yet', async () => {
		const worker = require( '@wordpress/video-conversion/worker' );
		const { cancelGifToVideoOperations } = require( '../video-conversion' );

		await expect( cancelGifToVideoOperations( 'item-1' ) ).resolves.toBe(
			false
		);
		expect( worker.cancelGifToVideoOperations ).not.toHaveBeenCalled();
	} );

	it( 'delegates to the worker once the module is loaded', async () => {
		const worker = require( '@wordpress/video-conversion/worker' );
		worker.convertGifToVideo.mockResolvedValue( new ArrayBuffer( 4 ) );
		worker.cancelGifToVideoOperations.mockResolvedValue( true );

		const {
			convertGifToVideo,
			cancelGifToVideoOperations,
		} = require( '../video-conversion' );

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
		const worker = require( '@wordpress/video-conversion/worker' );
		worker.convertGifToVideo.mockResolvedValue( new ArrayBuffer( 4 ) );
		worker.cancelGifToVideoOperations.mockResolvedValue( true );

		const {
			convertGifToVideo,
			cancelGifToVideoOperations,
		} = require( '../video-conversion' );

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
		jest.resetModules();
	} );

	it( 'is a no-op when the worker module has not been loaded yet', () => {
		const worker = require( '@wordpress/video-conversion/worker' );
		const {
			terminateVideoConversionWorker,
		} = require( '../video-conversion' );

		expect( () => terminateVideoConversionWorker() ).not.toThrow();
		expect( worker.terminateVideoConversionWorker ).not.toHaveBeenCalled();
	} );

	it( 'terminates the worker once the module is loaded', async () => {
		const worker = require( '@wordpress/video-conversion/worker' );
		worker.convertGifToVideo.mockResolvedValue( new ArrayBuffer( 4 ) );

		const {
			convertGifToVideo,
			terminateVideoConversionWorker,
		} = require( '../video-conversion' );

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
