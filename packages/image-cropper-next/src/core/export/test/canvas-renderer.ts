/**
 * Internal dependencies
 */
import type { CropperState } from '../../types';
import { DEFAULT_STATE } from '../../constants';
import {
	loadImage,
	renderToCanvas,
	canvasToBlob,
	canvasToDataURL,
	exportCroppedImage,
} from '../canvas-renderer';

/**
 * Mock context that records all calls for assertion.
 */
function createMockContext() {
	return {
		setTransform: jest.fn(),
		translate: jest.fn(),
		rotate: jest.fn(),
		scale: jest.fn(),
		drawImage: jest.fn(),
		getImageData: jest.fn(),
		putImageData: jest.fn(),
		beginPath: jest.fn(),
		closePath: jest.fn(),
		moveTo: jest.fn(),
		lineTo: jest.fn(),
		clip: jest.fn(),
	};
}

/**
 * Create a mock canvas element with a spy-based 2D context.
 *
 * @param ctx The mock 2D context to attach to the canvas.
 */
function createMockCanvas( ctx: ReturnType< typeof createMockContext > ) {
	const canvas = {
		width: 0,
		height: 0,
		getContext: jest.fn().mockReturnValue( ctx ),
		toBlob: jest.fn(),
		toDataURL: jest.fn().mockReturnValue( 'data:image/png;base64,abc' ),
	};
	return canvas as unknown as HTMLCanvasElement;
}

/**
 * A default test state with an image loaded and a partial crop.
 *
 * @param overrides Optional partial state to merge.
 */
function createTestState( overrides?: Partial< CropperState > ): CropperState {
	return {
		...DEFAULT_STATE,
		image: {
			src: 'https://example.com/photo.jpg',
			naturalWidth: 800,
			naturalHeight: 600,
		},
		crop: { ...DEFAULT_STATE.crop },
		flip: { ...DEFAULT_STATE.flip },
		cropRect: { x: 0.1, y: 0.2, width: 0.5, height: 0.5 },
		...overrides,
	};
}

describe( 'loadImage', () => {
	it( 'should create an image element with crossOrigin set', async () => {
		const mockImage = {
			addEventListener: jest.fn(),
			set crossOrigin( value: string ) {
				this._crossOrigin = value;
			},
			get crossOrigin() {
				return this._crossOrigin;
			},
			_crossOrigin: '',
			set src( value: string ) {
				this._src = value;
				// Simulate successful load on next tick.
				const loadHandler = this.addEventListener.mock.calls.find(
					( call: string[] ) => call[ 0 ] === 'load'
				);
				if ( loadHandler ) {
					loadHandler[ 1 ]();
				}
			},
			get src() {
				return this._src;
			},
			_src: '',
		};

		// Replace global Image constructor.
		const originalImage = global.Image;
		global.Image = jest.fn( () => mockImage ) as unknown as typeof Image;

		try {
			const result = await loadImage( 'https://example.com/test.jpg' );
			expect( result ).toBe( mockImage );
			expect( mockImage.crossOrigin ).toBe( 'anonymous' );
			expect( mockImage.src ).toBe( 'https://example.com/test.jpg' );
			expect( mockImage.addEventListener ).toHaveBeenCalledWith(
				'load',
				expect.any( Function )
			);
			expect( mockImage.addEventListener ).toHaveBeenCalledWith(
				'error',
				expect.any( Function )
			);
		} finally {
			global.Image = originalImage;
		}
	} );

	it( 'should reject when the image fails to load', async () => {
		const loadError = new Error( 'Network error' );
		const mockImage = {
			addEventListener: jest.fn(),
			set crossOrigin( _value: string ) {},
			set src( _value: string ) {
				// Simulate error on next tick.
				const errorHandler = this.addEventListener.mock.calls.find(
					( call: string[] ) => call[ 0 ] === 'error'
				);
				if ( errorHandler ) {
					errorHandler[ 1 ]( loadError );
				}
			},
		};

		const originalImage = global.Image;
		global.Image = jest.fn( () => mockImage ) as unknown as typeof Image;

		try {
			await expect(
				loadImage( 'https://example.com/broken.jpg' )
			).rejects.toBe( loadError );
		} finally {
			global.Image = originalImage;
		}
	} );
} );

describe( 'renderToCanvas', () => {
	let mockCtx: ReturnType< typeof createMockContext >;
	let canvasCount: number;

	beforeEach( () => {
		mockCtx = createMockContext();
		canvasCount = 0;

		// Mock document.createElement to return our mock canvases.
		jest.spyOn( document, 'createElement' ).mockImplementation(
			( tag: string ) => {
				if ( tag === 'canvas' ) {
					canvasCount++;
					return createMockCanvas(
						mockCtx
					) as unknown as HTMLElement;
				}
				return document.createElement( tag );
			}
		);
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should call setTransform and drawImage', () => {
		const state = createTestState();
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
		} as HTMLImageElement;

		renderToCanvas( mockImage, state );

		// Single canvas for direct rendering.
		expect( canvasCount ).toBe( 1 );

		// New implementation uses setTransform (not translate/rotate/scale).
		expect( mockCtx.setTransform ).toHaveBeenCalledTimes( 1 );
		expect( mockCtx.setTransform ).toHaveBeenCalledWith(
			expect.any( Number ),
			expect.any( Number ),
			expect.any( Number ),
			expect.any( Number ),
			expect.any( Number ),
			expect.any( Number )
		);

		// drawImage called once — direct render into crop canvas.
		expect( mockCtx.drawImage ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should apply flip scale factors when flip is enabled', () => {
		const state = createTestState( {
			flip: { horizontal: true, vertical: true },
		} );
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
		} as HTMLImageElement;

		// Render without flip for comparison.
		const stateNoFlip = createTestState( {
			flip: { horizontal: false, vertical: false },
		} );
		const mockCtxNoFlip = createMockContext();
		const canvasCountRef = { value: 0 };
		jest.restoreAllMocks();
		jest.spyOn( document, 'createElement' ).mockImplementation(
			( tag: string ) => {
				if ( tag === 'canvas' ) {
					canvasCountRef.value++;
					// Alternate between flip and no-flip contexts.
					const ctx =
						canvasCountRef.value === 1 ? mockCtxNoFlip : mockCtx;
					return createMockCanvas( ctx ) as unknown as HTMLElement;
				}
				return document.createElement( tag );
			}
		);

		renderToCanvas( mockImage, stateNoFlip );
		renderToCanvas( mockImage, state );

		// Both should call setTransform once each.
		expect( mockCtxNoFlip.setTransform ).toHaveBeenCalledTimes( 1 );
		expect( mockCtx.setTransform ).toHaveBeenCalledTimes( 1 );

		// The a (scaleX) component of the matrix should differ between flip and no-flip.
		const noFlipArgs = mockCtxNoFlip.setTransform.mock.calls[ 0 ];
		const flipArgs = mockCtx.setTransform.mock.calls[ 0 ];
		// With horizontal+vertical flip, the sign of scale components should be negated.
		expect( Math.sign( noFlipArgs[ 0 ] ) ).not.toBe(
			Math.sign( flipArgs[ 0 ] )
		);
	} );

	it( 'should apply rotation — matrix differs for rotated vs non-rotated', () => {
		const stateRotated = createTestState( { rotation: 90 } );
		const stateNormal = createTestState( { rotation: 0 } );
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
		} as HTMLImageElement;

		const mockCtxRotated = createMockContext();
		const mockCtxNormal = createMockContext();
		const canvasCountRef = { value: 0 };
		jest.restoreAllMocks();
		jest.spyOn( document, 'createElement' ).mockImplementation(
			( tag: string ) => {
				if ( tag === 'canvas' ) {
					canvasCountRef.value++;
					const ctx =
						canvasCountRef.value === 1
							? mockCtxNormal
							: mockCtxRotated;
					return createMockCanvas( ctx ) as unknown as HTMLElement;
				}
				return document.createElement( tag );
			}
		);

		renderToCanvas( mockImage, stateNormal );
		renderToCanvas( mockImage, stateRotated );

		expect( mockCtxNormal.setTransform ).toHaveBeenCalledTimes( 1 );
		expect( mockCtxRotated.setTransform ).toHaveBeenCalledTimes( 1 );

		const normalArgs = mockCtxNormal.setTransform.mock.calls[ 0 ];
		const rotatedArgs = mockCtxRotated.setTransform.mock.calls[ 0 ];
		// The matrix components should differ when rotation changes.
		const matricesDiffer = normalArgs.some(
			( v: number, i: number ) => Math.abs( v - rotatedArgs[ i ] ) > 1e-9
		);
		expect( matricesDiffer ).toBe( true );
	} );
} );

describe( 'canvasToBlob', () => {
	it( 'should call canvas.toBlob with the correct arguments', async () => {
		const mockBlob = new Blob( [ 'test' ], { type: 'image/png' } );
		const mockCanvas = {
			toBlob: jest.fn( ( callback: BlobCallback ) => {
				callback( mockBlob );
			} ),
		} as unknown as HTMLCanvasElement;

		const result = await canvasToBlob( mockCanvas, 'image/webp', 0.8 );

		expect( mockCanvas.toBlob ).toHaveBeenCalledWith(
			expect.any( Function ),
			'image/webp',
			0.8
		);
		expect( result ).toBe( mockBlob );
	} );

	it( 'should use default mime type and quality when not specified', async () => {
		const mockBlob = new Blob( [ 'test' ], { type: 'image/png' } );
		const mockCanvas = {
			toBlob: jest.fn( ( callback: BlobCallback ) => {
				callback( mockBlob );
			} ),
		} as unknown as HTMLCanvasElement;

		await canvasToBlob( mockCanvas );

		expect( mockCanvas.toBlob ).toHaveBeenCalledWith(
			expect.any( Function ),
			'image/png',
			0.92
		);
	} );

	it( 'should reject when toBlob returns null', async () => {
		const mockCanvas = {
			toBlob: jest.fn( ( callback: BlobCallback ) => {
				callback( null );
			} ),
		} as unknown as HTMLCanvasElement;

		await expect( canvasToBlob( mockCanvas ) ).rejects.toThrow(
			'Canvas toBlob returned null'
		);
	} );
} );

describe( 'canvasToDataURL', () => {
	it( 'should call canvas.toDataURL with correct arguments', () => {
		const mockCanvas = {
			toDataURL: jest
				.fn()
				.mockReturnValue( 'data:image/jpeg;base64,abc' ),
		} as unknown as HTMLCanvasElement;

		const result = canvasToDataURL( mockCanvas, 'image/jpeg', 0.85 );

		expect( mockCanvas.toDataURL ).toHaveBeenCalledWith(
			'image/jpeg',
			0.85
		);
		expect( result ).toBe( 'data:image/jpeg;base64,abc' );
	} );

	it( 'should use default mime type and quality when not specified', () => {
		const mockCanvas = {
			toDataURL: jest.fn().mockReturnValue( 'data:image/png;base64,xyz' ),
		} as unknown as HTMLCanvasElement;

		canvasToDataURL( mockCanvas );

		expect( mockCanvas.toDataURL ).toHaveBeenCalledWith(
			'image/png',
			0.92
		);
	} );
} );

describe( 'exportCroppedImage', () => {
	let originalImage: typeof Image;

	beforeEach( () => {
		originalImage = global.Image;

		// Mock Image constructor for loadImage.
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
			addEventListener: jest.fn(),
			_crossOrigin: '',
			set crossOrigin( value: string ) {
				this._crossOrigin = value;
			},
			get crossOrigin() {
				return this._crossOrigin;
			},
			_src: '',
			set src( value: string ) {
				this._src = value;
				const loadHandler = this.addEventListener.mock.calls.find(
					( call: string[] ) => call[ 0 ] === 'load'
				);
				if ( loadHandler ) {
					loadHandler[ 1 ]();
				}
			},
			get src() {
				return this._src;
			},
		};
		global.Image = jest.fn( () => mockImage ) as unknown as typeof Image;

		// Mock document.createElement for renderToCanvas.
		const mockBlob = new Blob( [ 'test' ], { type: 'image/png' } );
		const mockCtx = createMockContext();
		jest.spyOn( document, 'createElement' ).mockImplementation(
			( tag: string ) => {
				if ( tag === 'canvas' ) {
					const canvas = createMockCanvas( mockCtx );
					( canvas as any ).toBlob = jest.fn(
						( callback: BlobCallback ) => {
							callback( mockBlob );
						}
					);
					return canvas as unknown as HTMLElement;
				}
				return document.createElement( tag );
			}
		);
	} );

	afterEach( () => {
		global.Image = originalImage;
		jest.restoreAllMocks();
	} );

	it( 'should chain loadImage, renderToCanvas, and canvasToBlob', async () => {
		const state = createTestState();
		const result = await exportCroppedImage(
			'https://example.com/photo.jpg',
			state,
			'image/webp',
			0.9
		);

		expect( result ).toBeInstanceOf( Blob );
	} );

	it( 'should return null when an error occurs', async () => {
		// Override Image to simulate a load error.
		const errorImage = {
			addEventListener: jest.fn(),
			set crossOrigin( _value: string ) {},
			set src( _value: string ) {
				const errorHandler = this.addEventListener.mock.calls.find(
					( call: string[] ) => call[ 0 ] === 'error'
				);
				if ( errorHandler ) {
					errorHandler[ 1 ]( new Error( 'Load failed' ) );
				}
			},
		};
		global.Image = jest.fn( () => errorImage ) as unknown as typeof Image;

		const state = createTestState();
		const result = await exportCroppedImage(
			'https://example.com/broken.jpg',
			state
		);

		expect( result ).toBeNull();
	} );
} );
