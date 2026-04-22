/**
 * Internal dependencies
 */
import type { CropperState } from '../../types';
import { DEFAULT_STATE } from '../../constants';
import {
	loadImage,
	renderToCanvas,
	applyToCanvas,
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
		pan: { ...DEFAULT_STATE.pan },
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

	it( 'throws when image fails to load', async () => {
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
		await expect(
			exportCroppedImage( 'https://example.com/broken.jpg', state )
		).rejects.toBeDefined();
	} );

	it( 'propagates CORS-taint errors from canvasToBlob', async () => {
		// Mock Image to resolve (simulating a successful load even from
		// a tainted source — the browser doesn't flag the load itself,
		// only the later toBlob call).
		global.Image = jest.fn( () => {
			const img: {
				addEventListener: jest.Mock;
				crossOrigin: string;
				src: string;
				naturalWidth: number;
				naturalHeight: number;
			} = {
				addEventListener: jest.fn(
					( event: string, fn: () => void ) => {
						if ( event === 'load' ) {
							// Fire load synchronously after src is set.
							queueMicrotask( fn );
						}
					}
				),
				crossOrigin: '',
				src: '',
				naturalWidth: 800,
				naturalHeight: 600,
			};
			return img;
		} ) as unknown as typeof Image;

		// Mock canvas to throw SecurityError from toBlob (CORS-taint).
		const corsCanvas = {
			width: 0,
			height: 0,
			getContext: jest.fn( () => ( {
				setTransform: jest.fn(),
				drawImage: jest.fn(),
			} ) ),
			toBlob: jest.fn( () => {
				throw new DOMException(
					'Tainted canvases may not be exported',
					'SecurityError'
				);
			} ),
		};
		jest.spyOn( document, 'createElement' ).mockImplementation( ( (
			tag: string
		) => {
			if ( tag === 'canvas' ) {
				return corsCanvas as unknown as HTMLElement;
			}
			return document.createElement( tag );
		} ) as typeof document.createElement );

		const state = createTestState();
		await expect(
			exportCroppedImage(
				'https://cross-origin.example/photo.jpg',
				state
			)
		).rejects.toMatchObject( { name: 'SecurityError' } );

		jest.restoreAllMocks();
	} );

	it( 'throws descriptive error when canvas context is unavailable', () => {
		// Mock canvas.getContext to return null (no 2D context available).
		const noCtxCanvas = {
			width: 0,
			height: 0,
			getContext: jest.fn( () => null ),
		};
		jest.spyOn( document, 'createElement' ).mockImplementation( ( (
			tag: string
		) => {
			if ( tag === 'canvas' ) {
				return noCtxCanvas as unknown as HTMLElement;
			}
			return document.createElement( tag );
		} ) as typeof document.createElement );

		const state = createTestState();
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
		} as HTMLImageElement;

		expect( () => renderToCanvas( mockImage, state ) ).toThrow(
			/2D context/i
		);

		jest.restoreAllMocks();
	} );
} );

describe( 'renderToCanvas — export matrix verification', () => {
	let mockCtx: ReturnType< typeof createMockContext >;

	function setupMockCanvas() {
		mockCtx = createMockContext();
		jest.spyOn( document, 'createElement' ).mockImplementation(
			( tag: string ) => {
				if ( tag === 'canvas' ) {
					return createMockCanvas(
						mockCtx
					) as unknown as HTMLElement;
				}
				return document.createElement( tag );
			}
		);
	}

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'identity state (no rotation, no zoom, full crop) should produce a 1:1 mapping', () => {
		setupMockCanvas();
		const state = createTestState( {
			rotation: 0,
			zoom: 1,
			flip: { horizontal: false, vertical: false },
			pan: { x: 0, y: 0 },
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		} );
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
		} as HTMLImageElement;

		renderToCanvas( mockImage, state );

		expect( mockCtx.setTransform ).toHaveBeenCalledTimes( 1 );
		const [ a, b, c, d, e, f ] = mockCtx.setTransform.mock.calls[ 0 ];

		// For identity: a and d should be positive scale factors (output/input),
		// b and c should be ~0 (no skew/rotation).
		expect( b ).toBeCloseTo( 0, 5 );
		expect( c ).toBeCloseTo( 0, 5 );
		expect( a ).toBeGreaterThan( 0 );
		expect( d ).toBeGreaterThan( 0 );
		// a and d should be approximately equal (uniform scale for 800x600 full crop).
		expect( a ).toBeCloseTo( d, 5 );

		// Translation e,f should position the image so that pixel (0,0) maps
		// to a consistent output location.
		expect( typeof e ).toBe( 'number' );
		expect( typeof f ).toBe( 'number' );
	} );

	it( '90-degree rotation should encode rotation in the matrix a,b,c,d values', () => {
		setupMockCanvas();
		const state = createTestState( {
			rotation: 90,
			zoom: 1,
			flip: { horizontal: false, vertical: false },
			pan: { x: 0, y: 0 },
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		} );
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
		} as HTMLImageElement;

		renderToCanvas( mockImage, state );

		expect( mockCtx.setTransform ).toHaveBeenCalledTimes( 1 );
		const [ a, b, c, d ] = mockCtx.setTransform.mock.calls[ 0 ];

		// For a 90° rotation, cos(90°)=0, sin(90°)=1.
		// The diagonal (a, d) should be ~0 and the off-diagonal (b, c) should
		// be non-zero, encoding the rotation.
		expect( a ).toBeCloseTo( 0, 3 );
		expect( d ).toBeCloseTo( 0, 3 );
		expect( Math.abs( b ) ).toBeGreaterThan( 0.1 );
		expect( Math.abs( c ) ).toBeGreaterThan( 0.1 );
		// b and c should have opposite signs for a proper rotation matrix.
		expect( Math.sign( b ) ).not.toBe( Math.sign( c ) );
	} );

	it( 'zoom 2x should double the scale components', () => {
		setupMockCanvas();

		// Render at zoom=1.
		const stateZ1 = createTestState( {
			rotation: 0,
			zoom: 1,
			flip: { horizontal: false, vertical: false },
			pan: { x: 0, y: 0 },
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		} );
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
		} as HTMLImageElement;
		renderToCanvas( mockImage, stateZ1 );
		const [ a1, , , d1 ] = mockCtx.setTransform.mock.calls[ 0 ];

		// Reset for zoom=2.
		jest.restoreAllMocks();
		setupMockCanvas();
		const stateZ2 = createTestState( {
			rotation: 0,
			zoom: 2,
			flip: { horizontal: false, vertical: false },
			pan: { x: 0, y: 0 },
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		} );
		renderToCanvas( mockImage, stateZ2 );
		const [ a2, , , d2 ] = mockCtx.setTransform.mock.calls[ 0 ];

		// The scale components should double.
		expect( a2 ).toBeCloseTo( a1 * 2, 5 );
		expect( d2 ).toBeCloseTo( d1 * 2, 5 );
	} );

	it( 'horizontal flip should negate the x-scale component', () => {
		setupMockCanvas();

		// No flip.
		const stateNoFlip = createTestState( {
			rotation: 0,
			zoom: 1,
			flip: { horizontal: false, vertical: false },
			pan: { x: 0, y: 0 },
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		} );
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
		} as HTMLImageElement;
		renderToCanvas( mockImage, stateNoFlip );
		const [ aNoFlip ] = mockCtx.setTransform.mock.calls[ 0 ];

		// Reset for horizontal flip.
		jest.restoreAllMocks();
		setupMockCanvas();
		const stateFlip = createTestState( {
			rotation: 0,
			zoom: 1,
			flip: { horizontal: true, vertical: false },
			pan: { x: 0, y: 0 },
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		} );
		renderToCanvas( mockImage, stateFlip );
		const [ aFlip ] = mockCtx.setTransform.mock.calls[ 0 ];

		// The x-scale (a) should be negated.
		expect( aNoFlip ).toBeGreaterThan( 0 );
		expect( aFlip ).toBeLessThan( 0 );
		expect( aFlip ).toBeCloseTo( -aNoFlip, 5 );
	} );
} );

describe( 'applyToCanvas — export matrix verification', () => {
	let mockCtx: ReturnType< typeof createMockContext >;
	let canvasWidths: number[];
	let canvasHeights: number[];

	function setupMockCanvas() {
		mockCtx = createMockContext();
		canvasWidths = [];
		canvasHeights = [];
		jest.spyOn( document, 'createElement' ).mockImplementation(
			( tag: string ) => {
				if ( tag === 'canvas' ) {
					const canvas = createMockCanvas( mockCtx );
					// Track canvas size assignments.
					const originalDescriptor = {
						width: 0,
						height: 0,
					};
					Object.defineProperty( canvas, 'width', {
						get: () => originalDescriptor.width,
						set: ( v: number ) => {
							originalDescriptor.width = v;
							canvasWidths.push( v );
						},
					} );
					Object.defineProperty( canvas, 'height', {
						get: () => originalDescriptor.height,
						set: ( v: number ) => {
							originalDescriptor.height = v;
							canvasHeights.push( v );
						},
					} );
					return canvas as unknown as HTMLElement;
				}
				return document.createElement( tag );
			}
		);
	}

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should create a canvas with correct dimensions and call setTransform', () => {
		setupMockCanvas();

		const state = createTestState( {
			rotation: 0,
			zoom: 1,
			flip: { horizontal: false, vertical: false },
			pan: { x: 0, y: 0 },
			cropRect: { x: 0.1, y: 0.2, width: 0.5, height: 0.5 },
		} );
		const sourceSize = { width: 800, height: 600 };
		const mockSource = {} as CanvasImageSource;

		applyToCanvas( mockSource, sourceSize, state );

		// Canvas dimensions should match the crop region in natural pixels.
		const expectedW = Math.round( 0.5 * 800 );
		const expectedH = Math.round( 0.5 * 600 );
		expect( canvasWidths ).toContain( expectedW );
		expect( canvasHeights ).toContain( expectedH );

		// setTransform should be called with 6 numeric matrix values.
		expect( mockCtx.setTransform ).toHaveBeenCalledTimes( 1 );
		expect( mockCtx.setTransform ).toHaveBeenCalledWith(
			expect.any( Number ),
			expect.any( Number ),
			expect.any( Number ),
			expect.any( Number ),
			expect.any( Number ),
			expect.any( Number )
		);

		// drawImage should be called with the source.
		expect( mockCtx.drawImage ).toHaveBeenCalledTimes( 1 );
		expect( mockCtx.drawImage ).toHaveBeenCalledWith( mockSource, 0, 0 );
	} );

	it( 'should use custom output size when provided', () => {
		setupMockCanvas();

		const state = createTestState( {
			rotation: 0,
			zoom: 1,
			flip: { horizontal: false, vertical: false },
			pan: { x: 0, y: 0 },
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		} );
		const sourceSize = { width: 800, height: 600 };
		const outputSize = { width: 200, height: 150 };
		const mockSource = {} as CanvasImageSource;

		applyToCanvas( mockSource, sourceSize, state, outputSize );

		expect( canvasWidths ).toContain( 200 );
		expect( canvasHeights ).toContain( 150 );
		expect( mockCtx.setTransform ).toHaveBeenCalledTimes( 1 );
	} );
} );
