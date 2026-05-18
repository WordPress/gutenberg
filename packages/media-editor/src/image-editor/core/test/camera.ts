import {
	createCamera,
	worldToScreen,
	screenToWorld,
	getVisibleBounds,
	createExportCamera,
	getImageFit,
	getRotatedBBox,
} from '../camera';
import {
	restrictPanZoom,
	restrictCropRect,
	getImageCropBounds,
} from '../containment';
import { getSourceRegion, getSourceRegionPercent } from '../source-region';
import { computeTransformStyle } from '../transform-style';
import { DEFAULT_STATE } from '../constants';
import type { CropperState, Size } from '../types';

const CONTAINER: Size = { width: 800, height: 600 };
const IMAGE: Size = { width: 1600, height: 900 };

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
