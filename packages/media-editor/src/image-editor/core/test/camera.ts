import {
	createCamera,
	worldToScreen,
	screenToWorld,
	getVisibleBounds,
	createExportCamera,
	getImageFit,
	getRotatedBBox,
	getViewScale,
} from '../camera';
import {
	restrictPanZoom,
	restrictCropRect,
	getImageCropBounds,
	getMinZoom,
} from '../containment';
import {
	getSourceRegion,
	getSourceRegionPercent,
	snapCropRectToSourcePixelGrid,
	snapCropRectToSourcePixels,
} from '../source-region';
import { computeTransformStyle } from '../transform-style';
import { DEFAULT_STATE, MAX_ZOOM, MIN_ZOOM } from '../constants';
import type { CropperState, Size } from '../types';

const CONTAINER: Size = { width: 800, height: 600 };
const IMAGE: Size = { width: 1600, height: 900 };
const PORTRAIT_IMAGE: Size = { width: 900, height: 1600 };

function makeState( overrides: Partial< CropperState > = {} ): CropperState {
	return {
		...DEFAULT_STATE,
		image: {
			src: 'test.jpg',
			naturalWidth: IMAGE.width,
			naturalHeight: IMAGE.height,
		},
		...overrides,
	};
}

function expectImageCoversCrop( state: CropperState, imageSize: Size ): void {
	const container: Size = { width: 1000, height: 1000 };
	const camera = createCamera( state, container, imageSize );
	const snapRotation = Math.round( state.rotation / 90 ) * 90;
	const baseCamera = createCamera(
		{
			...state,
			pan: { x: 0, y: 0 },
			zoom: 1,
			rotation: snapRotation,
		},
		container,
		imageSize
	);
	const vb = getVisibleBounds( baseCamera );
	const cr = state.cropRect;
	const stencilCorners: [ number, number ][] = [
		[ vb.left + cr.x * vb.width, vb.top + cr.y * vb.height ],
		[ vb.left + ( cr.x + cr.width ) * vb.width, vb.top + cr.y * vb.height ],
		[
			vb.left + ( cr.x + cr.width ) * vb.width,
			vb.top + ( cr.y + cr.height ) * vb.height,
		],
		[
			vb.left + cr.x * vb.width,
			vb.top + ( cr.y + cr.height ) * vb.height,
		],
	];

	for ( const corner of stencilCorners ) {
		const w = screenToWorld( camera, {
			x: corner[ 0 ],
			y: corner[ 1 ],
		} );
		expect( w.x ).toBeGreaterThanOrEqual( -0.001 );
		expect( w.x ).toBeLessThanOrEqual( 1.001 );
		expect( w.y ).toBeGreaterThanOrEqual( -0.001 );
		expect( w.y ).toBeLessThanOrEqual( 1.001 );
	}
}

describe( 'createCamera', () => {
	it( 'returns a mat2d', () => {
		const camera = createCamera( makeState(), CONTAINER, IMAGE );
		expect( camera ).toHaveLength( 6 );
	} );

	it( 'maps image center (0.5, 0.5) to container center at identity state', () => {
		const state = makeState();
		const camera = createCamera( state, CONTAINER, IMAGE );
		const screenPt = worldToScreen( camera, { x: 0.5, y: 0.5 } );
		expect( screenPt.x ).toBeCloseTo( CONTAINER.width / 2, 0 );
		expect( screenPt.y ).toBeCloseTo( CONTAINER.height / 2, 0 );
	} );

	it( 'worldToScreen and screenToWorld are inverses', () => {
		const state = makeState( {
			zoom: 1.5,
			rotation: 30,
			pan: { x: 0.1, y: -0.05 },
		} );
		const camera = createCamera( state, CONTAINER, IMAGE );
		const worldPt = { x: 0.3, y: 0.7 };
		const screenPt = worldToScreen( camera, worldPt );
		const roundTrip = screenToWorld( camera, screenPt );
		expect( roundTrip.x ).toBeCloseTo( worldPt.x, 5 );
		expect( roundTrip.y ).toBeCloseTo( worldPt.y, 5 );
	} );

	it( 'zoom=2 makes the image appear twice as large', () => {
		const state1 = makeState();
		const state2 = makeState( { zoom: 2 } );
		const cam1 = createCamera( state1, CONTAINER, IMAGE );
		const cam2 = createCamera( state2, CONTAINER, IMAGE );
		const p1 = worldToScreen( cam1, { x: 0.75, y: 0.5 } );
		const p2 = worldToScreen( cam2, { x: 0.75, y: 0.5 } );
		const center = CONTAINER.width / 2;
		expect( p2.x - center ).toBeCloseTo( 2 * ( p1.x - center ), 0 );
	} );

	it( 'horizontal flip mirrors x around container center', () => {
		const normal = makeState();
		const flipped = makeState( {
			flip: { horizontal: true, vertical: false },
		} );
		const camN = createCamera( normal, CONTAINER, IMAGE );
		const camF = createCamera( flipped, CONTAINER, IMAGE );
		const ptN = worldToScreen( camN, { x: 0.25, y: 0.5 } );
		const ptF = worldToScreen( camF, { x: 0.25, y: 0.5 } );
		const center = CONTAINER.width / 2;
		expect( ptF.x ).toBeCloseTo( 2 * center - ptN.x, 0 );
	} );

	it( 'rotation=90 rotates points 90 degrees around center', () => {
		const state = makeState( { rotation: 90 } );
		const camera = createCamera( state, CONTAINER, IMAGE );
		const center = worldToScreen( camera, { x: 0.5, y: 0.5 } );
		expect( center.x ).toBeCloseTo( CONTAINER.width / 2, 0 );
		expect( center.y ).toBeCloseTo( CONTAINER.height / 2, 0 );
	} );

	it( 'pan shifts the image in screen space', () => {
		const noPan = makeState();
		const withPan = makeState( { pan: { x: 0.1, y: 0 } } );
		const cam1 = createCamera( noPan, CONTAINER, IMAGE );
		const cam2 = createCamera( withPan, CONTAINER, IMAGE );
		const p1 = worldToScreen( cam1, { x: 0.5, y: 0.5 } );
		const p2 = worldToScreen( cam2, { x: 0.5, y: 0.5 } );
		expect( p2.x ).toBeGreaterThan( p1.x );
	} );
} );

describe( 'restrictPanZoom', () => {
	it( 'returns identity pan at default state', () => {
		const state = makeState();
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( result.pan.x ).toBeCloseTo( 0 );
		expect( result.pan.y ).toBeCloseTo( 0 );
		expect( result.zoom ).toBeCloseTo( 1 );
	} );
	it( 'clamps pan so image covers crop rect', () => {
		const state = makeState( { pan: { x: 5, y: 5 }, zoom: 1 } );
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( Math.abs( result.pan.x ) ).toBeLessThan( 1 );
		expect( Math.abs( result.pan.y ) ).toBeLessThan( 1 );
	} );
	it( 'increases zoom if too low for rotation', () => {
		const state = makeState( { rotation: 45, zoom: 1 } );
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( result.zoom ).toBeGreaterThanOrEqual( 1 );
	} );
	it( 'caps zoom at MAX_ZOOM', () => {
		const state = makeState( { zoom: MAX_ZOOM * 2 } );
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( result.zoom ).toBe( MAX_ZOOM );
	} );
	it( 'allows zoom below 1 when a fine-rotated portrait crop remains covered', () => {
		const cropRect = { x: 0.46, y: 0, width: 0.08, height: 1 };
		const state = makeState( {
			image: {
				src: 'portrait.jpg',
				naturalWidth: PORTRAIT_IMAGE.width,
				naturalHeight: PORTRAIT_IMAGE.height,
			},
			rotation: 19,
			zoom: 0.9,
			cropRect,
		} );
		const result = restrictPanZoom( state, PORTRAIT_IMAGE, cropRect );

		expect( result.zoom ).toBeGreaterThan( 0.9 );
		expect( result.zoom ).toBeLessThan( 1 );

		const restrictedState = makeState( {
			...state,
			pan: result.pan,
			zoom: result.zoom,
		} );
		expectImageCoversCrop( restrictedState, PORTRAIT_IMAGE );
	} );
	it( 'at 90° with zoom=1, allows zero pan on landscape image', () => {
		// At zoom=1, 90° rotation, the image exactly covers the visual area.
		// No pan should be possible in either direction.
		const state = makeState( {
			rotation: 90,
			zoom: 1,
			pan: { x: 0.3, y: 0.3 },
		} );
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( result.pan.x ).toBeCloseTo( 0, 5 );
		expect( result.pan.y ).toBeCloseTo( 0, 5 );
	} );
	it( 'at 90° with zoom=2, allows symmetric pan range', () => {
		// When zoomed in at 90° rotation, the pan range should be symmetric
		// between x and y (both should allow ±0.5 of visual dimension).
		const state90pos = makeState( {
			rotation: 90,
			zoom: 2,
			pan: { x: 0.5, y: 0 },
		} );
		const state90neg = makeState( {
			rotation: 90,
			zoom: 2,
			pan: { x: -0.5, y: 0 },
		} );
		const resultPos = restrictPanZoom(
			state90pos,
			IMAGE,
			state90pos.cropRect
		);
		const resultNeg = restrictPanZoom(
			state90neg,
			IMAGE,
			state90neg.cropRect
		);
		// Should allow meaningful horizontal pan (not clamped to 0).
		expect( resultPos.pan.x ).toBeGreaterThan( 0.1 );
		expect( resultNeg.pan.x ).toBeLessThan( -0.1 );
		// And the range should be symmetric.
		expect( resultPos.pan.x ).toBeCloseTo( -resultNeg.pan.x, 5 );
	} );
	it( 'at 0° with zoom=1, allows zero pan on landscape image', () => {
		const state = makeState( {
			rotation: 0,
			zoom: 1,
			pan: { x: 0.3, y: 0.3 },
		} );
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( result.pan.x ).toBeCloseTo( 0, 5 );
		expect( result.pan.y ).toBeCloseTo( 0, 5 );
	} );
} );

describe( 'getMinZoom', () => {
	it( 'falls back to MIN_ZOOM for invalid image dimensions', () => {
		const state = makeState( {
			image: {
				src: 'invalid.jpg',
				naturalWidth: 1000,
				naturalHeight: 0,
			},
		} );

		expect( getMinZoom( state ) ).toBe( MIN_ZOOM );
	} );

	it( 'returns a finite value for non-finite rotation and crop fields', () => {
		const state = makeState( {
			rotation: Number.NaN,
			cropRect: {
				x: 0,
				y: 0,
				width: Number.NaN,
				height: 1,
			},
		} );

		const minZoom = getMinZoom( state );
		expect( Number.isFinite( minZoom ) ).toBe( true );
		expect( minZoom ).toBeGreaterThan( 0 );
	} );
} );

describe( 'restrictCropRect', () => {
	it( 'returns same rect when it fits', () => {
		const rect = { x: 0, y: 0, width: 1, height: 1 };
		const result = restrictCropRect( rect, 1, 0, 16 / 9 );
		expect( result ).toBe( rect );
	} );
	it( 'shrinks rect when too large for zoom/rotation', () => {
		const rect = { x: 0, y: 0, width: 1, height: 1 };
		const result = restrictCropRect( rect, 1, 45, 1 );
		expect( result.width ).toBeLessThan( 1 );
		expect( result.height ).toBeLessThan( 1 );
	} );
} );

describe( 'createExportCamera', () => {
	it( 'image center maps to output center at identity state with full crop', () => {
		const state = makeState();
		const outputSize = { width: 400, height: 225 };
		const camera = createExportCamera( state, IMAGE, outputSize );
		const { vec2 } = require( 'gl-matrix' );
		const out = vec2.create();
		vec2.transformMat2d(
			out,
			[ IMAGE.width / 2, IMAGE.height / 2 ],
			camera
		);
		expect( out[ 0 ] ).toBeCloseTo( outputSize.width / 2, 0 );
		expect( out[ 1 ] ).toBeCloseTo( outputSize.height / 2, 0 );
	} );

	it( 'matches current renderToCanvas: identity maps full image to output', () => {
		const state = makeState();
		const outputSize = { width: IMAGE.width, height: IMAGE.height };
		const camera = createExportCamera( state, IMAGE, outputSize );
		const { vec2 } = require( 'gl-matrix' );
		const topLeft = vec2.create();
		vec2.transformMat2d( topLeft, [ 0, 0 ], camera );
		expect( topLeft[ 0 ] ).toBeCloseTo( 0, 0 );
		expect( topLeft[ 1 ] ).toBeCloseTo( 0, 0 );
		const bottomRight = vec2.create();
		vec2.transformMat2d(
			bottomRight,
			[ IMAGE.width, IMAGE.height ],
			camera
		);
		expect( bottomRight[ 0 ] ).toBeCloseTo( outputSize.width, 0 );
		expect( bottomRight[ 1 ] ).toBeCloseTo( outputSize.height, 0 );
	} );

	it( 'at fine rotation, exported pixels track the stencil frame (preview / export agree)', () => {
		// Stencil frames some image content via the preview camera; the
		// export camera must pick the SAME image pixels. Before this
		// fix, the export used the true-rotation bbox while the preview
		// used the snap-rotation bbox, so any fine rotation shifted the
		// exported region sideways relative to what the stencil framed.
		const state = makeState( {
			rotation: 15,
			zoom: 1.5,
			cropRect: { x: 0.2, y: 0.15, width: 0.5, height: 0.6 },
		} );
		const container: Size = { width: 800, height: 600 };

		// Preview path: find the source-image pixel that lands at the
		// stencil center on screen.
		const previewCamera = createCamera( state, container, IMAGE );
		const snapRotation = Math.round( state.rotation / 90 ) * 90;
		const baseCamera = createCamera(
			{
				...state,
				pan: { x: 0, y: 0 },
				zoom: 1,
				rotation: snapRotation,
			},
			container,
			IMAGE
		);
		const vb = getVisibleBounds( baseCamera );
		const stencilCenterScreen = {
			x:
				vb.left +
				( state.cropRect.x + state.cropRect.width / 2 ) * vb.width,
			y:
				vb.top +
				( state.cropRect.y + state.cropRect.height / 2 ) * vb.height,
		};
		const previewWorld = screenToWorld(
			previewCamera,
			stencilCenterScreen
		);
		const previewPx = {
			x: previewWorld.x * IMAGE.width,
			y: previewWorld.y * IMAGE.height,
		};

		// Export path: the source pixel that maps to the center of the
		// output canvas.
		const outputSize = { width: 400, height: 300 };
		const exportCamera = createExportCamera( state, IMAGE, outputSize );
		const { mat2d: m2d, vec2 } = require( 'gl-matrix' );
		const inv = m2d.create();
		m2d.invert( inv, exportCamera );
		const exportPxVec = vec2.create();
		vec2.transformMat2d(
			exportPxVec,
			[ outputSize.width / 2, outputSize.height / 2 ],
			inv
		);

		// Preview and export must agree on the source pixel at crop center.
		expect( exportPxVec[ 0 ] ).toBeCloseTo( previewPx.x, 0 );
		expect( exportPxVec[ 1 ] ).toBeCloseTo( previewPx.y, 0 );
	} );
} );

describe( 'containment invariant (property-based)', () => {
	/**
	 * Verify that the image fully covers the crop rect by projecting all
	 * four crop corners through the inverse camera and checking that the
	 * resulting world-space points lie within [0,1] x [0,1] (the image).
	 *
	 * @param state     The cropper state to verify.
	 * @param imageSize The natural image dimensions.
	 */
	function verifyImageCoversCrop(
		state: CropperState,
		imageSize: Size
	): void {
		const container: Size = { width: 1000, height: 1000 };
		const camera = createCamera( state, container, imageSize );

		// Build base camera (zero pan, zoom=1) for stencil positioning.
		// The stencil is laid out at the nearest 90° rotation (matching
		// `getImageFit` in production), so build the base camera with
		// that snap rotation for consistent stencil corners.
		const snapRotation = Math.round( state.rotation / 90 ) * 90;
		const baseCamera = createCamera(
			{
				...state,
				pan: { x: 0, y: 0 },
				zoom: 1,
				rotation: snapRotation,
			},
			container,
			imageSize
		);
		const vb = getVisibleBounds( baseCamera );
		const cr = state.cropRect;

		// Stencil corners in screen space.
		const stencilCorners: [ number, number ][] = [
			[ vb.left + cr.x * vb.width, vb.top + cr.y * vb.height ],
			[
				vb.left + ( cr.x + cr.width ) * vb.width,
				vb.top + cr.y * vb.height,
			],
			[
				vb.left + ( cr.x + cr.width ) * vb.width,
				vb.top + ( cr.y + cr.height ) * vb.height,
			],
			[
				vb.left + cr.x * vb.width,
				vb.top + ( cr.y + cr.height ) * vb.height,
			],
		];

		// Map to world space via inverse camera.
		for ( const corner of stencilCorners ) {
			const w = screenToWorld( camera, {
				x: corner[ 0 ],
				y: corner[ 1 ],
			} );
			expect( w.x ).toBeGreaterThanOrEqual( -0.001 );
			expect( w.x ).toBeLessThanOrEqual( 1.001 );
			expect( w.y ).toBeGreaterThanOrEqual( -0.001 );
			expect( w.y ).toBeLessThanOrEqual( 1.001 );
		}
	}

	const ROTATIONS = [ 0, 15, 30, 45, 60, 75, 90, 135, 180, 270 ];
	const ZOOMS = [ 1, 1.5, 2, 3, 5 ];
	const CROP_RECTS = [
		{ label: 'full', rect: { x: 0, y: 0, width: 1, height: 1 } },
		{
			label: 'centered-small',
			rect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
		},
		{
			label: 'off-center',
			rect: { x: 0.1, y: 0.1, width: 0.3, height: 0.4 },
		},
	];

	for ( const rotation of ROTATIONS ) {
		for ( const zoom of ZOOMS ) {
			for ( const { label, rect } of CROP_RECTS ) {
				it( `rotation=${ rotation } zoom=${ zoom } crop=${ label }`, () => {
					const state = makeState( {
						rotation,
						zoom,
						cropRect: rect,
					} );
					const restricted = restrictPanZoom( state, IMAGE, rect );
					expect( restricted.zoom ).toBeGreaterThanOrEqual( 1 );
					const restrictedState = makeState( {
						...state,
						pan: restricted.pan,
						zoom: restricted.zoom,
						cropRect: rect,
					} );
					verifyImageCoversCrop( restrictedState, IMAGE );
				} );
			}
		}
	}

	it( 'holds across 200 random pan/zoom/rotation/crop combinations', () => {
		let passCount = 0;
		for ( let i = 0; i < 200; i++ ) {
			// Deterministic-ish: use i to seed values.
			const rotation =
				ROTATIONS[ i % ROTATIONS.length ] + ( ( i * 7 ) % 15 );
			const zoom = 1 + ( ( i * 13 ) % 40 ) / 10;
			const cropW = 0.2 + ( ( i * 3 ) % 8 ) / 10;
			const cropH = 0.2 + ( ( i * 5 ) % 8 ) / 10;
			const cropX = Math.min( ( ( i * 11 ) % 10 ) / 10, 1 - cropW );
			const cropY = Math.min( ( ( i * 17 ) % 10 ) / 10, 1 - cropH );
			const rect = {
				x: cropX,
				y: cropY,
				width: cropW,
				height: cropH,
			};

			const panX = ( ( ( i * 19 ) % 20 ) - 10 ) / 10;
			const panY = ( ( ( i * 23 ) % 20 ) - 10 ) / 10;

			const state = makeState( {
				rotation,
				zoom,
				pan: { x: panX, y: panY },
				cropRect: rect,
			} );

			const restricted = restrictPanZoom( state, IMAGE, rect );
			const restrictedState = makeState( {
				...state,
				pan: restricted.pan,
				zoom: restricted.zoom,
				cropRect: rect,
			} );

			verifyImageCoversCrop( restrictedState, IMAGE );
			passCount++;
		}
		expect( passCount ).toBe( 200 );
	} );
} );

describe( 'getSourceRegion', () => {
	it( 'at default state, source region matches full image', () => {
		const state = makeState();
		const region = getSourceRegion( state, IMAGE );
		expect( region.x ).toBeCloseTo( 0, 0 );
		expect( region.y ).toBeCloseTo( 0, 0 );
		expect( region.width ).toBeCloseTo( IMAGE.width, 0 );
		expect( region.height ).toBeCloseTo( IMAGE.height, 0 );
		expect( region.rotation ).toBe( 0 );
		expect( region.zoom ).toBe( 1 );
	} );

	it( 'at zoom=2 with centered crop, source region is half the image dimensions', () => {
		const state = makeState( { zoom: 2 } );
		const region = getSourceRegion( state, IMAGE );
		expect( region.width ).toBeCloseTo( IMAGE.width / 2, 0 );
		expect( region.height ).toBeCloseTo( IMAGE.height / 2, 0 );
		// Centered: source region center should be at image center.
		expect( region.x + region.width / 2 ).toBeCloseTo( IMAGE.width / 2, 0 );
		expect( region.y + region.height / 2 ).toBeCloseTo(
			IMAGE.height / 2,
			0
		);
	} );

	it( 'at 90-degree rotation, source region dimensions are swapped', () => {
		const state = makeState( { rotation: 90 } );
		const region = getSourceRegion( state, IMAGE );
		// At 90° the rotated bounding box swaps roles: the crop covers the
		// full visual area, so the visible source width maps from the image
		// height and vice versa. The key invariant is that the region's
		// aspect ratio flips relative to the default.
		const defaultRegion = getSourceRegion( makeState(), IMAGE );
		const defaultAR = defaultRegion.width / defaultRegion.height;
		const rotatedAR = region.width / region.height;
		// Rotated AR should be roughly the inverse of default AR.
		expect( rotatedAR ).toBeCloseTo( 1 / defaultAR, 1 );
		expect( region.rotation ).toBe( 90 );
	} );
} );

describe( 'snapCropRectToSourcePixels', () => {
	const getSourceEdges = ( state: CropperState ) => {
		const region = getSourceRegion( state, IMAGE );
		return {
			left: region.x,
			top: region.y,
			right: region.x + region.width,
			bottom: region.y + region.height,
		};
	};

	it( 'snaps the selected source-region edges to whole pixels under pan and zoom', () => {
		const state = makeState( {
			zoom: 2.25,
			pan: { x: 0.013, y: -0.017 },
			cropRect: { x: 0.12, y: 0.18, width: 0.33, height: 0.41 },
		} );
		const candidate = { x: 0.123, y: 0.187, width: 0.337, height: 0.419 };

		const unsnapped = getSourceRegion(
			{ ...state, cropRect: candidate },
			IMAGE
		);
		expect(
			Math.abs(
				unsnapped.x +
					unsnapped.width -
					Math.round( unsnapped.x + unsnapped.width )
			)
		).toBeGreaterThan( 0.01 );
		expect(
			Math.abs(
				unsnapped.y +
					unsnapped.height -
					Math.round( unsnapped.y + unsnapped.height )
			)
		).toBeGreaterThan( 0.01 );

		const snappedCropRect = snapCropRectToSourcePixels(
			state,
			IMAGE,
			candidate,
			'se'
		);

		const snapped = getSourceEdges( {
			...state,
			cropRect: snappedCropRect,
		} );
		expect( snapped.left ).toBeCloseTo( unsnapped.x, 3 );
		expect( snapped.top ).toBeCloseTo( unsnapped.y, 3 );
		expect( snapped.right ).toBeCloseTo( Math.round( snapped.right ), 3 );
		expect( snapped.bottom ).toBeCloseTo( Math.round( snapped.bottom ), 3 );
	} );

	it( 'snaps all source-region edges to whole pixels', () => {
		const state = makeState( {
			rotation: 30,
			zoom: 2.25,
			pan: { x: 0.013, y: -0.017 },
			cropRect: { x: 0.12, y: 0.18, width: 0.33, height: 0.41 },
		} );
		const candidate = { x: 0.123, y: 0.187, width: 0.337, height: 0.419 };

		const snappedCropRect = snapCropRectToSourcePixelGrid(
			state,
			IMAGE,
			candidate
		);
		const snapped = getSourceEdges( {
			...state,
			cropRect: snappedCropRect,
		} );

		expect( snapped.left ).toBeCloseTo( Math.round( snapped.left ), 3 );
		expect( snapped.top ).toBeCloseTo( Math.round( snapped.top ), 3 );
		expect( snapped.right ).toBeCloseTo( Math.round( snapped.right ), 3 );
		expect( snapped.bottom ).toBeCloseTo( Math.round( snapped.bottom ), 3 );
	} );

	it( 'does not snap selected edges while fine rotation couples source axes', () => {
		const state = makeState( {
			rotation: 30,
			zoom: 2.25,
			pan: { x: 0.013, y: -0.017 },
			cropRect: { x: 0.12, y: 0.18, width: 0.33, height: 0.41 },
		} );
		const candidate = { x: 0.123, y: 0.187, width: 0.337, height: 0.419 };

		expect(
			snapCropRectToSourcePixels( state, IMAGE, candidate, 'e' )
		).toBe( candidate );
	} );

	it( 'returns the input crop rect when the image dimensions are invalid', () => {
		const cropRect = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };

		expect(
			snapCropRectToSourcePixels(
				makeState(),
				{ width: 0, height: 0 },
				cropRect,
				'se'
			)
		).toBe( cropRect );
	} );
} );

describe( 'getSourceRegionPercent', () => {
	it( 'at default state, returns 0/0/100/100', () => {
		const state = makeState();
		const pct = getSourceRegionPercent( state, IMAGE );
		expect( pct.x ).toBeCloseTo( 0, 0 );
		expect( pct.y ).toBeCloseTo( 0, 0 );
		expect( pct.width ).toBeCloseTo( 100, 0 );
		expect( pct.height ).toBeCloseTo( 100, 0 );
	} );

	it( 'at zoom=2 centered, returns 25/25/50/50', () => {
		const state = makeState( { zoom: 2 } );
		const pct = getSourceRegionPercent( state, IMAGE );
		expect( pct.width ).toBeCloseTo( 50, 0 );
		expect( pct.height ).toBeCloseTo( 50, 0 );
		// Centered: x and y should each be 25%.
		expect( pct.x ).toBeCloseTo( 25, 0 );
		expect( pct.y ).toBeCloseTo( 25, 0 );
	} );

	it( 'percentages sum correctly (x + width ≤ 100, y + height ≤ 100)', () => {
		const state = makeState( { zoom: 3, pan: { x: 0.1, y: -0.05 } } );
		const pct = getSourceRegionPercent( state, IMAGE );
		expect( pct.x + pct.width ).toBeLessThanOrEqual( 100.01 );
		expect( pct.y + pct.height ).toBeLessThanOrEqual( 100.01 );
		expect( pct.x ).toBeGreaterThanOrEqual( -0.01 );
		expect( pct.y ).toBeGreaterThanOrEqual( -0.01 );
	} );

	it( 'matches getSourceRegion divided by image dimensions', () => {
		const state = makeState( {
			zoom: 1.5,
			pan: { x: 0.05, y: -0.02 },
			rotation: 15,
		} );
		const region = getSourceRegion( state, IMAGE );
		const pct = getSourceRegionPercent( state, IMAGE );
		expect( pct.x ).toBeCloseTo( ( region.x / IMAGE.width ) * 100, 5 );
		expect( pct.y ).toBeCloseTo( ( region.y / IMAGE.height ) * 100, 5 );
		expect( pct.width ).toBeCloseTo(
			( region.width / IMAGE.width ) * 100,
			5
		);
		expect( pct.height ).toBeCloseTo(
			( region.height / IMAGE.height ) * 100,
			5
		);
	} );

	it( 'returns zeros for zero-dimension image', () => {
		const state = makeState();
		const pct = getSourceRegionPercent( state, {
			width: 0,
			height: 0,
		} );
		expect( pct.x ).toBe( 0 );
		expect( pct.y ).toBe( 0 );
		expect( pct.width ).toBe( 0 );
		expect( pct.height ).toBe( 0 );
	} );

	it( 'with small centered crop rect, percentages reflect visible portion', () => {
		// 50% crop rect centered → at zoom=1, the crop covers half the
		// visual area. The percentage region should be roughly 50% of
		// the image in each axis.
		const state = makeState( {
			cropRect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
			zoom: 1,
		} );
		const pct = getSourceRegionPercent( state, IMAGE );
		expect( pct.width ).toBeCloseTo( 50, 0 );
		expect( pct.height ).toBeCloseTo( 50, 0 );
	} );
} );

describe( 'getImageCropBounds', () => {
	it( 'returns the image AABB — handles can reach the image edge regardless of container size', () => {
		// 500×375 (4:3) in a 600×400 container (3:2).
		// At zoom=1.75 the image overflows the container. Bounds should reflect
		// the image footprint, not the container edge, so one drag can reach the
		// image edge (viewport pan reveals content outside the canvas boundary).
		const nat: Size = { width: 500, height: 375 };
		const container: Size = { width: 600, height: 400 };
		const { elementSize, visualSize } = getImageFit( container, nat, 0 );

		expect( visualSize.width ).toBeLessThan( container.width );

		const state = makeState( {
			image: {
				src: 'test.jpg',
				naturalWidth: nat.width,
				naturalHeight: nat.height,
			},
			zoom: 1.75,
			rotation: 0,
		} );

		const bounds = getImageCropBounds( state, elementSize, visualSize );

		// At zoom=1.75 the image extends well beyond the container on all sides.
		// Bounds should be the image AABB corners (≈ ±0.375), not the container
		// edges (which would be ≈ ±0.0625).
		expect( bounds.minX ).toBeLessThan( -0.3 );
		expect( bounds.maxX ).toBeGreaterThan( 1.3 );
		expect( bounds.minY ).toBeLessThan( -0.3 );
		expect( bounds.maxY ).toBeGreaterThan( 1.3 );
	} );
} );

// ─────────────────────────────────────────────────────────────────────────────
// Non-finite input regressions.
//
// The reducer normalizes rotation/zoom/pan on every action, so these paths
// aren't user-reachable today. But programmatic callers and deserialized
// state could still feed corrupted values, which used to silently propagate
// NaN/Infinity into the crop rect, camera matrix, or REST /edit payload.
// These tests pin the defense-in-depth guards in place.
// ─────────────────────────────────────────────────────────────────────────────

const HOSTILE_STATE: CropperState = makeState( {
	pan: { x: Number.NaN, y: Number.NEGATIVE_INFINITY },
	zoom: Number.POSITIVE_INFINITY,
	rotation: Number.NaN,
} );

describe( 'getRotatedBBox — non-finite input regression', () => {
	it.each( [
		[ 'NaN width', Number.NaN, 100, 30 ],
		[ '±Infinity height', 100, Number.POSITIVE_INFINITY, 30 ],
		[ 'NaN rotation', 100, 100, Number.NaN ],
		[ '-Infinity rotation', 100, 100, Number.NEGATIVE_INFINITY ],
		// MAX_VALUE is finite but degreesToRadians( MAX_VALUE ) overflows
		// to Infinity, then Math.cos/sin return NaN. The magnitude bound
		// in `isSafeNumber` catches this before the trig.
		[ 'MAX_VALUE rotation', 100, 100, Number.MAX_VALUE ],
	] )( 'returns {0, 0} for %s', ( _label, w, h, rot ) => {
		expect( getRotatedBBox( w, h, rot ) ).toEqual( {
			width: 0,
			height: 0,
		} );
	} );

	it( 'still returns correct dimensions for normal inputs', () => {
		// Sanity check that the guard doesn't break the happy path.
		const out = getRotatedBBox( 200, 100, 90 );
		expect( out.width ).toBeCloseTo( 100, 5 );
		expect( out.height ).toBeCloseTo( 200, 5 );
	} );
} );

describe( 'getImageFit — non-finite input regression', () => {
	it( 'returns finite sizes when rotation is NaN (treated as 0)', () => {
		const out = getImageFit( CONTAINER, IMAGE, Number.NaN );
		expect( Number.isFinite( out.elementSize.width ) ).toBe( true );
		expect( Number.isFinite( out.elementSize.height ) ).toBe( true );
		expect( Number.isFinite( out.visualSize.width ) ).toBe( true );
		expect( Number.isFinite( out.visualSize.height ) ).toBe( true );
	} );

	it( 'returns zero sizes when containerSize has a non-finite dimension', () => {
		const out = getImageFit( { width: Number.NaN, height: 600 }, IMAGE, 0 );
		expect( out.elementSize ).toEqual( { width: 0, height: 0 } );
		expect( out.visualSize ).toEqual( { width: 0, height: 0 } );
	} );

	it( 'returns zero sizes when imageSize has a non-finite dimension', () => {
		const out = getImageFit(
			CONTAINER,
			{ width: Number.POSITIVE_INFINITY, height: 900 },
			0
		);
		expect( out.elementSize ).toEqual( { width: 0, height: 0 } );
		expect( out.visualSize ).toEqual( { width: 0, height: 0 } );
	} );
} );

describe( 'createCamera — non-finite input regression', () => {
	it( 'returns a matrix with all finite entries even for hostile state', () => {
		const m = createCamera( HOSTILE_STATE, CONTAINER, IMAGE );
		expect( m ).toHaveLength( 6 );
		for ( let i = 0; i < 6; i++ ) {
			expect( Number.isFinite( m[ i ] ) ).toBe( true );
		}
	} );

	it( 'returns identity matrix when imageSize has non-finite dimensions', () => {
		const m = createCamera( makeState(), CONTAINER, {
			width: Number.NaN,
			height: 900,
		} );
		// mat2d.create() returns [1, 0, 0, 1, 0, 0] (identity).
		expect( Array.from( m ) ).toEqual( [ 1, 0, 0, 1, 0, 0 ] );
	} );
} );

describe( 'createExportCamera — non-finite input regression', () => {
	it( 'returns a matrix with all finite entries even for hostile state', () => {
		// This is the matrix passed to ctx.setTransform → ctx.drawImage at
		// export time, so NaN here would corrupt the saved file.
		const m = createExportCamera( HOSTILE_STATE, IMAGE, {
			width: 600,
			height: 400,
		} );
		for ( let i = 0; i < 6; i++ ) {
			expect( Number.isFinite( m[ i ] ) ).toBe( true );
		}
	} );

	it( 'returns identity matrix when outputSize has non-finite dimensions', () => {
		const m = createExportCamera( makeState(), IMAGE, {
			width: Number.POSITIVE_INFINITY,
			height: 400,
		} );
		expect( Array.from( m ) ).toEqual( [ 1, 0, 0, 1, 0, 0 ] );
	} );
} );

describe( 'restrictCropRect — non-finite input regression', () => {
	const cropRect = { x: 0.1, y: 0.1, width: 0.5, height: 0.5 };

	it.each( [
		[ 'NaN zoom', cropRect, Number.NaN, 0, 16 / 9 ],
		[ '-Infinity rotation', cropRect, 1, Number.NEGATIVE_INFINITY, 16 / 9 ],
		[ 'NaN aspectRatio', cropRect, 1, 0, Number.NaN ],
		[
			'MAX_VALUE zoom (overflow guard)',
			cropRect,
			Number.MAX_VALUE,
			0,
			16 / 9,
		],
	] )( 'returns a finite rect for %s', ( _label, rect, z, r, a ) => {
		const out = restrictCropRect( rect, z, r, a );
		expect( Number.isFinite( out.x ) ).toBe( true );
		expect( Number.isFinite( out.y ) ).toBe( true );
		expect( Number.isFinite( out.width ) ).toBe( true );
		expect( Number.isFinite( out.height ) ).toBe( true );
	} );

	it( 'sanitizes cropRect fields on the no-resize (fit-through) path', () => {
		// When the crop already fits (t >= 1 - EPSILON) the function used to
		// return the raw cropRect, letting non-finite fields slip through.
		const hostileRect = {
			x: Number.NaN,
			y: 0.1,
			width: 0.3,
			height: 0.3,
		};
		const out = restrictCropRect( hostileRect, 10, 0, 16 / 9 );
		expect( Number.isFinite( out.x ) ).toBe( true );
		expect( out.x ).toBe( 0 );
	} );
} );

describe( 'restrictPanZoom — non-finite input regression', () => {
	const cropRect = { x: 0.1, y: 0.1, width: 0.5, height: 0.5 };

	it( 'returns finite pan and zoom for hostile state', () => {
		const out = restrictPanZoom( HOSTILE_STATE, IMAGE, cropRect );
		expect( Number.isFinite( out.zoom ) ).toBe( true );
		expect( Number.isFinite( out.pan.x ) ).toBe( true );
		expect( Number.isFinite( out.pan.y ) ).toBe( true );
	} );

	it( 'returns finite pan and zoom when only state.zoom is corrupted', () => {
		const state = makeState( { zoom: Number.NaN } );
		const out = restrictPanZoom( state, IMAGE, cropRect );
		expect( Number.isFinite( out.zoom ) ).toBe( true );
		expect( out.zoom ).toBeGreaterThanOrEqual( 1 );
	} );

	it( 'sanitizes the cropRect argument before feeding it into the math', () => {
		// A NaN cropRect.width would drive getMinZoomForCover to NaN via
		// Math.max(1, NaN, NaN), and that NaN would be returned as zoom.
		const hostileRect = {
			x: 0.1,
			y: 0.1,
			width: Number.NaN,
			height: 0.5,
		};
		const out = restrictPanZoom( makeState(), IMAGE, hostileRect );
		expect( Number.isFinite( out.zoom ) ).toBe( true );
		expect( Number.isFinite( out.pan.x ) ).toBe( true );
		expect( Number.isFinite( out.pan.y ) ).toBe( true );
	} );

	it( 'returns finite zoom when imageSize is Infinity (aspectRatio NaN guard)', () => {
		// Infinity / Infinity = NaN, which used to leak as `zoom: NaN`
		// through the no-correction early return.
		const rect = { x: 0.1, y: 0.1, width: 0.5, height: 0.5 };
		const out = restrictPanZoom(
			makeState(),
			{ width: Infinity, height: Infinity },
			rect
		);
		expect( Number.isFinite( out.zoom ) ).toBe( true );
		expect( Number.isFinite( out.pan.x ) ).toBe( true );
		expect( Number.isFinite( out.pan.y ) ).toBe( true );
	} );
} );

describe( 'computeTransformStyle — non-finite input regression', () => {
	it( 'produces a finite matrix string for hostile state', () => {
		// CSS preview path must agree with createCamera under hostile state
		// (both should produce safe output, not divergent NaN vs finite).
		const out = computeTransformStyle( HOSTILE_STATE, IMAGE );
		expect( out ).toMatch( /^matrix\(/ );
		expect( out ).not.toMatch( /NaN/ );
		expect( out ).not.toMatch( /Infinity/ );
	} );

	it( 'returns the identity matrix when imageSize is hostile', () => {
		// State sanitization only covers state fields; imageSize NaN/Infinity
		// would still emit `matrix(..., NaN, NaN)` in the translate components
		// without this explicit guard.
		expect(
			computeTransformStyle( makeState(), {
				width: Number.NaN,
				height: 900,
			} )
		).toBe( 'matrix(1, 0, 0, 1, 0, 0)' );
		expect(
			computeTransformStyle( makeState(), {
				width: Infinity,
				height: Infinity,
			} )
		).toBe( 'matrix(1, 0, 0, 1, 0, 0)' );
	} );
} );

describe( 'getImageCropBounds — non-finite input regression', () => {
	it( 'returns finite bounds for hostile state', () => {
		const out = getImageCropBounds(
			HOSTILE_STATE,
			{ width: 800, height: 450 },
			{ width: 800, height: 450 }
		);
		expect( Number.isFinite( out.minX ) ).toBe( true );
		expect( Number.isFinite( out.minY ) ).toBe( true );
		expect( Number.isFinite( out.maxX ) ).toBe( true );
		expect( Number.isFinite( out.maxY ) ).toBe( true );
		expect( out.minX ).toBeLessThanOrEqual( out.maxX );
		expect( out.minY ).toBeLessThanOrEqual( out.maxY );
	} );
} );

describe( 'getSourceRegion — non-finite input regression', () => {
	it( 'returns a finite source region for hostile state', () => {
		// getSourceRegion feeds the REST /edit endpoint, so NaN here would
		// reach the server.
		const out = getSourceRegion( HOSTILE_STATE, IMAGE );
		expect( Number.isFinite( out.x ) ).toBe( true );
		expect( Number.isFinite( out.y ) ).toBe( true );
		expect( Number.isFinite( out.width ) ).toBe( true );
		expect( Number.isFinite( out.height ) ).toBe( true );
	} );

	it( 'returns finite metadata on the zero-size early-return path', () => {
		// When imageSize is zero/invalid, the function returns a zero region
		// plus rotation/flip/zoom metadata. Hostile state must not leak NaN
		// out through those metadata fields.
		const out = getSourceRegion( HOSTILE_STATE, {
			width: 0,
			height: 0,
		} );
		expect( Number.isFinite( out.rotation ) ).toBe( true );
		expect( Number.isFinite( out.zoom ) ).toBe( true );
		expect( out.zoom ).toBeGreaterThanOrEqual( 1 );
	} );
} );

describe( 'getViewScale — presentational magnification to fill the canvas', () => {
	// A tall image (1400x2500) fit into a short, wide canvas (1000x500):
	// contain fit = min(1000/1400, 500/2500) = 0.2, so the rendered footprint
	// is 280x500 — it fills the canvas height but only 280 of 1000 px wide.
	const CANVAS: Size = { width: 1000, height: 500 };
	const FOOTPRINT: Size = { width: 280, height: 500 };
	const TARGET = 0.8;
	const MAX = 8;

	it( 'returns 1 when the crop already fills at least the target on its binding axis', () => {
		// Full-footprint crop is 280x500 on screen: 500 == canvas height, well
		// above 0.8 of it. No magnification needed.
		const full = { x: 0, y: 0, width: 1, height: 1 };
		expect( getViewScale( full, CANVAS, FOOTPRINT, TARGET, MAX ) ).toBe(
			1
		);
	} );

	it( 'magnifies an under-filling crop so its binding axis reaches target * canvas', () => {
		// A square crop in the 280x500 footprint: width fills (cropRect.width=1
		// -> 280px), height is 280/500 = 0.56 (-> 280px). On-screen 280x280.
		// kW = 0.8*1000/280 = 2.857, kH = 0.8*500/280 = 1.4286, k = min = 1.4286.
		const square = { x: 0, y: 0.22, width: 1, height: 280 / 500 };
		const scale = getViewScale( square, CANVAS, FOOTPRINT, TARGET, MAX );
		expect( scale ).toBeCloseTo( ( TARGET * 500 ) / 280, 5 );
		// After magnification the binding (height) axis reaches 0.8 * canvas.
		expect( square.height * FOOTPRINT.height * scale ).toBeCloseTo(
			TARGET * CANVAS.height,
			5
		);
	} );

	it( 'clamps magnification at maxScale for a near-degenerate crop', () => {
		// Tiny crop would need an enormous scale to fill; cap it.
		const tiny = { x: 0.5, y: 0.5, width: 0.02, height: 0.02 };
		expect( getViewScale( tiny, CANVAS, FOOTPRINT, TARGET, MAX ) ).toBe(
			MAX
		);
	} );

	it( 'never shrinks below 1 even when the crop overfills the target', () => {
		const full = { x: 0, y: 0, width: 1, height: 1 };
		expect( getViewScale( full, CANVAS, FOOTPRINT, 0.5, MAX ) ).toBe( 1 );
	} );

	it( 'returns 1 for zero or degenerate inputs', () => {
		const full = { x: 0, y: 0, width: 1, height: 1 };
		const zeroRect = { x: 0, y: 0, width: 0, height: 0 };
		expect( getViewScale( zeroRect, CANVAS, FOOTPRINT, TARGET, MAX ) ).toBe(
			1
		);
		expect(
			getViewScale(
				full,
				{ width: 0, height: 0 },
				FOOTPRINT,
				TARGET,
				MAX
			)
		).toBe( 1 );
		expect(
			getViewScale( full, CANVAS, { width: 0, height: 0 }, TARGET, MAX )
		).toBe( 1 );
	} );

	it( 'returns 1 (never NaN) for non-finite inputs', () => {
		const full = { x: 0, y: 0, width: 1, height: 1 };
		const nanRect = { x: 0, y: 0, width: NaN, height: 1 };
		expect( getViewScale( nanRect, CANVAS, FOOTPRINT, TARGET, MAX ) ).toBe(
			1
		);
		expect(
			getViewScale(
				full,
				{ width: NaN, height: 500 },
				FOOTPRINT,
				TARGET,
				MAX
			)
		).toBe( 1 );
		expect(
			getViewScale(
				full,
				CANVAS,
				{ width: Infinity, height: 500 },
				TARGET,
				MAX
			)
		).toBe( 1 );
		expect( getViewScale( full, CANVAS, FOOTPRINT, NaN, MAX ) ).toBe( 1 );
		expect( getViewScale( full, CANVAS, FOOTPRINT, TARGET, NaN ) ).toBe(
			1
		);
	} );
} );

describe( 'getViewScale — property invariants', () => {
	const ITERATIONS = 100;

	it( `holds across ${ ITERATIONS } random valid inputs`, () => {
		for ( let i = 0; i < ITERATIONS; i++ ) {
			const canvasW = 200 + ( ( i * 37 ) % 1800 );
			const canvasH = 200 + ( ( i * 53 ) % 1200 );
			const footprintW = 50 + ( ( i * 19 ) % 800 );
			const footprintH = 50 + ( ( i * 29 ) % 1000 );
			const cropW = 0.05 + ( ( i * 3 ) % 95 ) / 100;
			const cropH = 0.05 + ( ( i * 5 ) % 95 ) / 100;
			const cropX = Math.min( ( ( i * 11 ) % 100 ) / 100, 1 - cropW );
			const cropY = Math.min( ( ( i * 17 ) % 100 ) / 100, 1 - cropH );
			const targetFill = 0.1 + ( ( i * 7 ) % 90 ) / 100;
			const maxScale = 1 + ( ( i * 13 ) % 20 );

			const canvas: Size = { width: canvasW, height: canvasH };
			const footprint: Size = { width: footprintW, height: footprintH };
			const cropRect = {
				x: cropX,
				y: cropY,
				width: cropW,
				height: cropH,
			};

			const scale = getViewScale(
				cropRect,
				canvas,
				footprint,
				targetFill,
				maxScale
			);

			expect( Number.isFinite( scale ) ).toBe( true );
			expect( scale ).toBeGreaterThanOrEqual( 1 );
			expect( scale ).toBeLessThanOrEqual( maxScale );

			const cropScreenW = cropRect.width * footprintW;
			const cropScreenH = cropRect.height * footprintH;
			const kW = ( targetFill * canvasW ) / cropScreenW;
			const kH = ( targetFill * canvasH ) / cropScreenH;
			const k = Math.min( kW, kH );
			const unclamped = Math.max( 1, k );

			expect( scale ).toBeCloseTo( Math.min( maxScale, unclamped ), 10 );

			const shouldCheckFill = scale > 1 && scale < maxScale - 1e-10;
			const bindingIsWidth = kW <= kH + 1e-10;
			const magnifiedBinding = bindingIsWidth
				? cropScreenW * scale
				: cropScreenH * scale;
			const targetBinding = bindingIsWidth
				? targetFill * canvasW
				: targetFill * canvasH;
			expect(
				shouldCheckFill ? magnifiedBinding / targetBinding : 1
			).toBeCloseTo( 1, shouldCheckFill ? 4 : 10 );
		}
	} );
} );
