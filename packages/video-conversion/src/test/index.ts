/**
 * Internal dependencies
 */
import {
	convertGifToVideo,
	cancelOperations,
	UNSUPPORTED_ERROR_PREFIX,
} from '../index';

// Configurable decoded-frame dimensions; the default (10x10) is even so the
// canvas/resize path is skipped. Tests set odd values to exercise it.
let mockFrameDims = { width: 10, height: 10 };

class FakeVideoFrame {
	duration = 100000; // microseconds
	timestamp = 0;
	displayWidth = mockFrameDims.width;
	displayHeight = mockFrameDims.height;
	closed = false;
	close() {
		this.closed = true;
	}
}

// Frames decoded by FakeImageDecoder, exposed so tests can assert on
// resource cleanup (e.g. that close() was called on error paths).
let mockDecodedFrames: FakeVideoFrame[] = [];
// Configurable frame count for the active FakeImageDecoder instance.
let mockFrameCount = 3;
// The track list's `ready` promise. The worker MUST await this (not
// `completed`) before reading `selectedTrack`/`frameCount`.
let mockTracksReady = Promise.resolve();
// `completed` resolves once the encoded bytes are received, which for a
// buffered source can be *before* parsing. The worker must not depend on it
// for track metadata; a test pins this by leaving it forever pending.
let mockCompleted: Promise< void > = Promise.resolve();

class FakeImageDecoder {
	completed = mockCompleted;
	tracks = {
		ready: mockTracksReady,
		selectedTrack: { frameCount: mockFrameCount },
	};
	init: { data: ArrayBuffer; type: string };
	constructor( init: { data: ArrayBuffer; type: string } ) {
		this.init = init;
	}
	async decode( { frameIndex }: { frameIndex: number } ) {
		const image = new FakeVideoFrame();
		image.timestamp = frameIndex * 100000;
		mockDecodedFrames.push( image );
		return { image };
	}
	close() {}
}

// Canvases/replacement frames created by the even-dimension resize path.
let mockCanvases: Array< { width: number; height: number } > = [];
let mockReplacementFrames: Array< { closed: boolean } > = [];

class FakeOffscreenCanvas {
	width: number;
	height: number;
	constructor( width: number, height: number ) {
		this.width = width;
		this.height = height;
		mockCanvases.push( this );
	}
	getContext() {
		return { drawImage() {} };
	}
}

class FakeReplacementVideoFrame {
	closed = false;
	source: unknown;
	init: unknown;
	constructor( source: unknown, init: unknown ) {
		this.source = source;
		this.init = init;
		mockReplacementFrames.push( this );
	}
	close() {
		this.closed = true;
	}
}

const mockAddedSamples: Array< {
	init: { timestamp: number; duration: number };
} > = [];
const mockCanEncodeVideo = jest.fn().mockResolvedValue( true );
// Default VideoSampleSource.add implementation; tests can override it,
// e.g. to make it reject and exercise frame-cleanup error paths.
const mockSourceAdd = jest.fn(
	async ( sample: { init: { timestamp: number; duration: number } } ) => {
		mockAddedSamples.push( sample );
	}
);
// A controllable gate so the cancellation test has a deterministic async
// boundary: convertGifToVideo awaits canEncodeVideo; we cancel while it is
// pending, then resolve it.
let encodeGateResolve: ( ( v: boolean ) => void ) | undefined;

// VideoSample instances created during encoding, so tests can assert each one
// is close()d (mediabunny warns about GC'd, unclosed samples).
let mockVideoSamples: Array< { closed: boolean } > = [];

jest.mock( 'mediabunny', () => ( {
	Output: class {
		opts: { target: { buffer: ArrayBuffer | null } };
		constructor( opts: { target: { buffer: ArrayBuffer | null } } ) {
			this.opts = opts;
		}
		addVideoTrack() {}
		async start() {}
		async finalize() {
			this.opts.target.buffer = new Uint8Array( [ 1, 2, 3 ] ).buffer;
		}
	},
	BufferTarget: class {
		buffer: ArrayBuffer | null = null;
	},
	Mp4OutputFormat: class {},
	WebMOutputFormat: class {},
	VideoSampleSource: class {
		add( sample: { init: { timestamp: number; duration: number } } ) {
			return mockSourceAdd( sample );
		}
	},
	VideoSample: class {
		frame: unknown;
		init: { timestamp: number; duration: number };
		closed = false;
		constructor(
			frame: unknown,
			init: { timestamp: number; duration: number }
		) {
			this.frame = frame;
			this.init = init;
			mockVideoSamples.push( this );
		}
		close() {
			this.closed = true;
		}
	},
	QUALITY_HIGH: 'quality-high',
	canEncodeVideo: ( ...args: unknown[] ) => mockCanEncodeVideo( ...args ),
} ) );

beforeEach( () => {
	mockAddedSamples.length = 0;
	mockDecodedFrames = [];
	mockFrameCount = 3;
	mockFrameDims = { width: 10, height: 10 };
	mockTracksReady = Promise.resolve();
	mockCompleted = Promise.resolve();
	mockCanvases = [];
	mockReplacementFrames = [];
	mockVideoSamples = [];
	encodeGateResolve = undefined;
	mockCanEncodeVideo.mockResolvedValue( true );
	mockSourceAdd.mockReset();
	mockSourceAdd.mockImplementation( async ( sample ) => {
		mockAddedSamples.push( sample );
	} );
	( globalThis as Record< string, unknown > ).ImageDecoder = FakeImageDecoder;
	( globalThis as Record< string, unknown > ).VideoEncoder = class {};
	( globalThis as Record< string, unknown > ).OffscreenCanvas =
		FakeOffscreenCanvas;
	( globalThis as Record< string, unknown > ).VideoFrame =
		FakeReplacementVideoFrame;
} );

const GIF_BUFFER = new Uint8Array( [ 0x47, 0x49, 0x46, 0x38 ] ).buffer;

describe( 'convertGifToVideo', () => {
	it( 'decodes every GIF frame and returns an ArrayBuffer', async () => {
		const result = await convertGifToVideo(
			'item-1',
			GIF_BUFFER,
			'video/mp4'
		);
		expect( result ).toBeInstanceOf( ArrayBuffer );
		expect( mockAddedSamples ).toHaveLength( 3 );
	} );

	it( 'converts ImageDecoder microsecond durations to mediabunny seconds', async () => {
		await convertGifToVideo( 'item-ts', GIF_BUFFER, 'video/mp4' );
		// Frame duration 100000us => 0.1s; timestamps accumulate in seconds.
		expect( mockAddedSamples[ 0 ].init.duration ).toBeCloseTo( 0.1, 6 );
		expect( mockAddedSamples[ 0 ].init.timestamp ).toBeCloseTo( 0, 6 );
		expect( mockAddedSamples[ 1 ].init.timestamp ).toBeCloseTo( 0.1, 6 );
		expect( mockAddedSamples[ 2 ].init.timestamp ).toBeCloseTo( 0.2, 6 );
	} );

	it( 'rejects when cancelled before encoding completes', async () => {
		mockCanEncodeVideo.mockImplementation(
			() =>
				new Promise< boolean >( ( resolve ) => {
					encodeGateResolve = resolve;
				} )
		);
		const promise = convertGifToVideo( 'item-2', GIF_BUFFER, 'video/mp4' );
		// Let execution reach the canEncodeVideo await.
		await new Promise( ( r ) => setTimeout( r, 0 ) );
		await cancelOperations( 'item-2' );
		encodeGateResolve?.( true );
		await expect( promise ).rejects.toThrow( /cancel/i );
	} );

	it( 'rejects with Unsupported when the codec cannot be encoded', async () => {
		mockCanEncodeVideo.mockResolvedValue( false );
		await expect(
			convertGifToVideo( 'item-3', GIF_BUFFER, 'video/mp4' )
		).rejects.toThrow( 'Unsupported' );
	} );

	it( 'prefixes graceful "unsupported" errors with UNSUPPORTED_ERROR_PREFIX (consumer contract)', async () => {
		// Pins the producer side of the cross-worker contract: consumers
		// detect a graceful fallback by this message prefix only (comctx
		// serializes errors to their message string). See
		// isUnsupportedConversionError in @wordpress/upload-media.
		( globalThis as Record< string, unknown > ).ImageDecoder = undefined;
		await expect(
			convertGifToVideo( 'item-prefix', GIF_BUFFER, 'video/mp4' )
		).rejects.toThrow( new RegExp( `^${ UNSUPPORTED_ERROR_PREFIX }:` ) );

		( globalThis as Record< string, unknown > ).ImageDecoder =
			FakeImageDecoder;
		mockCanEncodeVideo.mockResolvedValue( false );
		await expect(
			convertGifToVideo( 'item-prefix-2', GIF_BUFFER, 'video/mp4' )
		).rejects.toThrow( new RegExp( `^${ UNSUPPORTED_ERROR_PREFIX }:` ) );
	} );

	it( 'rejects when the GIF has zero decodable frames', async () => {
		mockFrameCount = 0;
		await expect(
			convertGifToVideo( 'item-zero', GIF_BUFFER, 'video/mp4' )
		).rejects.toThrow( /no decodable frames/i );
	} );

	it( 'closes the decoded frame even when source.add() throws', async () => {
		mockSourceAdd.mockReset();
		mockSourceAdd.mockRejectedValue( new Error( 'add failed' ) );

		await expect(
			convertGifToVideo( 'item-add-throw', GIF_BUFFER, 'video/mp4' )
		).rejects.toThrow( 'add failed' );

		// The first frame was decoded; it must have been closed despite the
		// add() rejection (Issue 1: frame leak on source.add() throw).
		expect( mockDecodedFrames ).toHaveLength( 1 );
		expect( mockDecodedFrames[ 0 ].closed ).toBe( true );
	} );

	it( 'reads track metadata after tracks.ready, not decoder.completed', async () => {
		// Regression: a buffered ArrayBuffer source resolves `completed`
		// before the GIF is parsed, so reading frameCount then yields 0
		// ("GIF contains no decodable frames"). The worker must gate on
		// `tracks.ready`. Proven here by making `completed` never resolve:
		// if the worker awaited it, this would hang.
		mockCompleted = new Promise< void >( () => {} );

		const result = await convertGifToVideo(
			'item-tracks-ready',
			GIF_BUFFER,
			'video/mp4'
		);

		expect( result ).toBeInstanceOf( ArrayBuffer );
		expect( mockAddedSamples ).toHaveLength( 3 );
	} );

	it( 'pads odd frame dimensions to even before encoding', async () => {
		// avc/vp9 reject odd width/height (e.g. a 599x441 GIF). Frames must
		// be redrawn onto an even-sized canvas even when no downscaling is
		// requested.
		mockFrameDims = { width: 599, height: 441 };

		const result = await convertGifToVideo(
			'item-odd-dims',
			GIF_BUFFER,
			'video/mp4'
		);

		expect( result ).toBeInstanceOf( ArrayBuffer );
		// One even-sized canvas per frame (599->600, 441->442).
		expect( mockCanvases ).toHaveLength( 3 );
		for ( const canvas of mockCanvases ) {
			expect( canvas.width % 2 ).toBe( 0 );
			expect( canvas.height % 2 ).toBe( 0 );
			expect( canvas.width ).toBe( 600 );
			expect( canvas.height ).toBe( 442 );
		}
		// The original odd-sized frames are closed once redrawn.
		expect( mockDecodedFrames ).toHaveLength( 3 );
		for ( const frame of mockDecodedFrames ) {
			expect( frame.closed ).toBe( true );
		}
	} );

	it( 'leaves already-even dimensions untouched (no canvas allocation)', async () => {
		// Default mockFrameDims is 10x10 (even): the resize path must be
		// skipped so even GIFs are not needlessly re-rasterized.
		await convertGifToVideo( 'item-even-dims', GIF_BUFFER, 'video/mp4' );

		expect( mockCanvases ).toHaveLength( 0 );
		expect( mockReplacementFrames ).toHaveLength( 0 );
	} );

	it( 'closes every VideoSample after adding it (no GC leak)', async () => {
		// mediabunny warns when a VideoSample is GC'd without close(); a
		// long GIF would leak one per frame.
		await convertGifToVideo( 'item-sample-close', GIF_BUFFER, 'video/mp4' );

		expect( mockVideoSamples ).toHaveLength( 3 );
		for ( const sample of mockVideoSamples ) {
			expect( sample.closed ).toBe( true );
		}
	} );

	it( 'closes the VideoSample even when source.add() throws', async () => {
		mockSourceAdd.mockReset();
		mockSourceAdd.mockRejectedValue( new Error( 'add failed' ) );

		await expect(
			convertGifToVideo(
				'item-sample-close-throw',
				GIF_BUFFER,
				'video/mp4'
			)
		).rejects.toThrow( 'add failed' );

		expect( mockVideoSamples ).toHaveLength( 1 );
		expect( mockVideoSamples[ 0 ].closed ).toBe( true );
	} );
} );
