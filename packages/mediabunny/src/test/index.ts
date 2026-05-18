/**
 * Internal dependencies
 */
import { convertGifToVideo, cancelOperations } from '../index';

class FakeVideoFrame {
	duration = 100000; // microseconds
	timestamp = 0;
	displayWidth = 10;
	displayHeight = 10;
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

class FakeImageDecoder {
	completed = Promise.resolve();
	tracks = { selectedTrack: { frameCount: mockFrameCount } };
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
		constructor(
			frame: unknown,
			init: { timestamp: number; duration: number }
		) {
			this.frame = frame;
			this.init = init;
		}
	},
	QUALITY_HIGH: 'quality-high',
	canEncodeVideo: ( ...args: unknown[] ) => mockCanEncodeVideo( ...args ),
} ) );

beforeEach( () => {
	mockAddedSamples.length = 0;
	mockDecodedFrames = [];
	mockFrameCount = 3;
	encodeGateResolve = undefined;
	mockCanEncodeVideo.mockResolvedValue( true );
	mockSourceAdd.mockReset();
	mockSourceAdd.mockImplementation( async ( sample ) => {
		mockAddedSamples.push( sample );
	} );
	( globalThis as Record< string, unknown > ).ImageDecoder = FakeImageDecoder;
	( globalThis as Record< string, unknown > ).VideoEncoder = class {};
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
} );
