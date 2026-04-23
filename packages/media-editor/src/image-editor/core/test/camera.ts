import {
	createCamera,
	worldToScreen,
	screenToWorld,
	getVisibleBounds,
	createExportCamera,
	getImageFit,
} from '../camera';
import {
	restrictPanZoom,
	restrictCropRect,
	getCropBounds,
} from '../containment';
import { getSourceRegion, getSourceRegionPercent } from '../source-region';
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

describe( 'getCropBounds', () => {
	it( 'allows crop handle to reach container edge when 4:3 image is zoomed in 3:2 container', () => {
		// MtBlanc1.jpg is 500×375 (4:3) in a 600×400 container (3:2).
		// At zoom=1, the image is 533×400 — 33px padding on each side.
		// At zoom=1.75, the image fills the container. The crop handle
		// should be able to reach the container left edge (pixel 0),
		// which is at normalized x = -0.0625.
		const nat: Size = { width: 500, height: 375 };
		const container: Size = { width: 600, height: 400 };
		const { elementSize, visualSize } = getImageFit( container, nat, 0 );

		// Verify the image doesn't fill the container at zoom=1.
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

		const bounds = getCropBounds(
			state,
			elementSize,
			visualSize,
			container
		);

		// boundsMinX should be negative (crop can extend left of visual image origin).
		expect( bounds.minX ).toBeLessThan( 0 );
		// The pixel position of boundsMinX should be the container left edge (pixel 0).
		const offsetX = ( container.width - visualSize.width ) / 2;
		const pixelLeft = offsetX + bounds.minX * visualSize.width;
		expect( pixelLeft ).toBeCloseTo( 0, 0 );

		// boundsMaxX should be > 1 (crop can extend right of visual image).
		expect( bounds.maxX ).toBeGreaterThan( 1 );
		const pixelRight = offsetX + bounds.maxX * visualSize.width;
		expect( pixelRight ).toBeCloseTo( container.width, 0 );
	} );
} );
