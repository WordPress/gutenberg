import {
	transcodeVideo,
	getVideoMetadata,
	UNSUPPORTED_ERROR_PREFIX,
} from '../index';

// Configurable primary-track metadata returned by the fake Input.
let mockTrack: {
	codec: string | null;
	width: number;
	height: number;
	bitrate: number;
	duration: number;
} | null = {
	codec: 'avc',
	width: 1280,
	height: 720,
	bitrate: 4_000_000,
	duration: 12,
};

// Records the options passed to Conversion.init so tests can assert on the
// resolved video options (codec, bitrate, dimensions, hardwareAcceleration).
let mockConversionVideoOptions: Record< string, unknown > | undefined;

const mockExecute = jest.fn().mockResolvedValue( undefined );
const mockCancel = jest.fn().mockResolvedValue( undefined );
const mockCanEncodeVideo = jest.fn().mockResolvedValue( true );

jest.mock( 'mediabunny', () => ( {
	// Defined inline because a jest.mock factory may only reference
	// `mock`-prefixed out-of-scope variables. Reads the shared mockTrack.
	Input: class {
		async getPrimaryVideoTrack() {
			// Read into a local so the accessors below close over a
			// non-nullable value rather than the mutable module variable.
			const track = mockTrack;
			if ( ! track ) {
				return null;
			}
			return {
				getCodec: async () => track.codec,
				getDisplayWidth: async () => track.width,
				getDisplayHeight: async () => track.height,
				computePacketStats: async () => ( {
					averageBitrate: track.bitrate,
					averagePacketRate: 30,
					packetCount: 360,
				} ),
				computeDuration: async () => track.duration,
			};
		}
	},
	Output: class {
		target: { buffer: ArrayBuffer | null };
		constructor( opts: { target: { buffer: ArrayBuffer | null } } ) {
			this.target = opts.target;
			// Populate the buffer so execute() yields a non-empty result.
			this.target.buffer = new Uint8Array( [ 1, 2, 3 ] ).buffer;
		}
	},
	Conversion: {
		init: async ( options: { video: Record< string, unknown > } ) => {
			mockConversionVideoOptions = options.video;
			return { execute: mockExecute, cancel: mockCancel };
		},
	},
	BlobSource: class {},
	BufferTarget: class {
		buffer: ArrayBuffer | null = null;
	},
	Mp4OutputFormat: class {},
	WebMOutputFormat: class {},
	VideoSampleSource: class {},
	VideoSample: class {},
	QUALITY_HIGH: 'quality-high',
	ALL_FORMATS: [],
	canEncodeVideo: ( ...args: unknown[] ) => mockCanEncodeVideo( ...args ),
} ) );

beforeEach( () => {
	mockTrack = {
		codec: 'avc',
		width: 1280,
		height: 720,
		bitrate: 4_000_000,
		duration: 12,
	};
	mockConversionVideoOptions = undefined;
	mockExecute.mockClear();
	mockCancel.mockClear();
	mockCanEncodeVideo.mockReset();
	mockCanEncodeVideo.mockResolvedValue( true );
	( globalThis as Record< string, unknown > ).VideoEncoder = class {};
} );

afterEach( () => {
	delete ( globalThis as Record< string, unknown > ).VideoEncoder;
} );

const VIDEO_BUFFER = new Uint8Array( [ 0, 0, 0, 1 ] ).buffer;

describe( 'transcodeVideo', () => {
	it( 'returns an encoded ArrayBuffer for an MP4 target', async () => {
		const result = await transcodeVideo(
			'item-1',
			VIDEO_BUFFER,
			'video/mp4'
		);
		expect( result ).toBeInstanceOf( ArrayBuffer );
		expect( mockExecute ).toHaveBeenCalledTimes( 1 );
		expect( mockConversionVideoOptions ).toMatchObject( {
			codec: 'avc',
			hardwareAcceleration: 'prefer-hardware',
		} );
	} );

	it( 'uses the vp9 codec for a WebM target', async () => {
		await transcodeVideo( 'item-webm', VIDEO_BUFFER, 'video/webm' );
		expect( mockConversionVideoOptions?.codec ).toBe( 'vp9' );
	} );

	it( 'caps the longest edge when maxDimensions is exceeded', async () => {
		mockTrack = {
			codec: 'avc',
			width: 3840,
			height: 2160,
			bitrate: 4_000_000,
			duration: 12,
		};
		await transcodeVideo( 'item-big', VIDEO_BUFFER, 'video/mp4', {
			maxDimensions: 1920,
		} );
		// Landscape video: width is the dominant edge, so it is capped while
		// height is left for mediabunny to deduce from aspect ratio.
		expect( mockConversionVideoOptions?.width ).toBe( 1920 );
		expect( mockConversionVideoOptions?.height ).toBeUndefined();
	} );

	it( 'throws an Unsupported error when WebCodecs is unavailable', async () => {
		delete ( globalThis as Record< string, unknown > ).VideoEncoder;
		await expect(
			transcodeVideo( 'item-x', VIDEO_BUFFER, 'video/mp4' )
		).rejects.toThrow( new RegExp( `^${ UNSUPPORTED_ERROR_PREFIX }` ) );
		expect( mockExecute ).not.toHaveBeenCalled();
	} );

	it( 'throws an Unsupported error when the codec cannot be encoded', async () => {
		mockCanEncodeVideo.mockResolvedValue( false );
		await expect(
			transcodeVideo( 'item-y', VIDEO_BUFFER, 'video/mp4' )
		).rejects.toThrow( new RegExp( `^${ UNSUPPORTED_ERROR_PREFIX }` ) );
		expect( mockExecute ).not.toHaveBeenCalled();
	} );

	it( 'falls back to no-preference when hardware encoding is unsupported', async () => {
		// Headless browsers, VMs and CI runners have no hardware encoder, so
		// 'prefer-hardware' is rejected while the software path is available.
		mockCanEncodeVideo.mockImplementation(
			async (
				_codec: string,
				probeOptions: { hardwareAcceleration?: string } = {}
			) => probeOptions.hardwareAcceleration !== 'prefer-hardware'
		);

		await transcodeVideo( 'item-sw', VIDEO_BUFFER, 'video/mp4' );

		expect( mockConversionVideoOptions?.hardwareAcceleration ).toBe(
			'no-preference'
		);
		expect( mockExecute ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'probes encoder support at the real output dimensions', async () => {
		mockTrack = {
			codec: 'avc',
			width: 3840,
			height: 2160,
			bitrate: 4_000_000,
			duration: 12,
		};

		await transcodeVideo( 'item-probe', VIDEO_BUFFER, 'video/mp4', {
			maxDimensions: 1920,
		} );

		// The probe must reflect the downscaled output, not the source, since
		// encoder support is parameter-specific.
		expect( mockCanEncodeVideo ).toHaveBeenCalledWith(
			'avc',
			expect.objectContaining( { width: 1920, height: 1080 } )
		);
	} );
} );

describe( 'getVideoMetadata', () => {
	it( 'reads codec, dimensions, bitrate and duration from the primary track', async () => {
		const metadata = await getVideoMetadata( VIDEO_BUFFER );
		expect( metadata ).toEqual( {
			codec: 'avc',
			width: 1280,
			height: 720,
			bitrate: 4_000_000,
			duration: 12,
		} );
	} );

	it( 'throws when there is no video track', async () => {
		mockTrack = null;
		await expect( getVideoMetadata( VIDEO_BUFFER ) ).rejects.toThrow(
			/no video track/i
		);
	} );
} );
