import {
	createCamera,
	worldToScreen,
	screenToWorld,
	getVisibleBounds,
	cropRectToScreenBounds,
	clampNormalized,
	getMinZoomForCover,
	restrictPanZoom,
	restrictCropRect,
	createExportCamera,
} from '../camera';
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
			crop: { x: 0.1, y: -0.05 },
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
		const withPan = makeState( { crop: { x: 0.1, y: 0 } } );
		const cam1 = createCamera( noPan, CONTAINER, IMAGE );
		const cam2 = createCamera( withPan, CONTAINER, IMAGE );
		const p1 = worldToScreen( cam1, { x: 0.5, y: 0.5 } );
		const p2 = worldToScreen( cam2, { x: 0.5, y: 0.5 } );
		expect( p2.x ).toBeGreaterThan( p1.x );
	} );
} );

describe( 'getVisibleBounds', () => {
	it( 'returns container-centered bounds at identity state', () => {
		const state = makeState();
		const camera = createCamera( state, CONTAINER, IMAGE );
		const bounds = getVisibleBounds( camera );
		expect( bounds.width ).toBeGreaterThan( 0 );
		expect( bounds.height ).toBeGreaterThan( 0 );
		expect( bounds.left + bounds.width / 2 ).toBeCloseTo(
			CONTAINER.width / 2,
			0
		);
		expect( bounds.top + bounds.height / 2 ).toBeCloseTo(
			CONTAINER.height / 2,
			0
		);
	} );

	it( 'zoom=2 doubles the visible bounds dimensions', () => {
		const cam1 = createCamera( makeState(), CONTAINER, IMAGE );
		const cam2 = createCamera( makeState( { zoom: 2 } ), CONTAINER, IMAGE );
		const b1 = getVisibleBounds( cam1 );
		const b2 = getVisibleBounds( cam2 );
		expect( b2.width ).toBeCloseTo( b1.width * 2, 0 );
		expect( b2.height ).toBeCloseTo( b1.height * 2, 0 );
	} );
} );

describe( 'cropRectToScreenBounds', () => {
	it( 'full crop rect at identity matches visible bounds', () => {
		const state = makeState();
		const camera = createCamera( state, CONTAINER, IMAGE );
		const cropBounds = cropRectToScreenBounds( camera, state.cropRect );
		const imageBounds = getVisibleBounds( camera );
		expect( cropBounds.left ).toBeCloseTo( imageBounds.left, 0 );
		expect( cropBounds.top ).toBeCloseTo( imageBounds.top, 0 );
		expect( cropBounds.width ).toBeCloseTo( imageBounds.width, 0 );
		expect( cropBounds.height ).toBeCloseTo( imageBounds.height, 0 );
	} );

	it( 'half crop rect has half the dimensions', () => {
		const state = makeState();
		const camera = createCamera( state, CONTAINER, IMAGE );
		const halfRect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
		const fullBounds = getVisibleBounds( camera );
		const halfBounds = cropRectToScreenBounds( camera, halfRect );
		expect( halfBounds.width ).toBeCloseTo( fullBounds.width * 0.5, 0 );
		expect( halfBounds.height ).toBeCloseTo( fullBounds.height * 0.5, 0 );
	} );
} );

describe( 'clampNormalized', () => {
	it( 'clamps below 0 to 0', () => {
		expect( clampNormalized( -0.5 ) ).toBe( 0 );
	} );
	it( 'clamps above 1 to 1', () => {
		expect( clampNormalized( 1.5 ) ).toBe( 1 );
	} );
	it( 'preserves values in range', () => {
		expect( clampNormalized( 0.5 ) ).toBe( 0.5 );
	} );
} );

describe( 'getMinZoomForCover', () => {
	it( 'returns 1 for full crop rect on square image', () => {
		const rect = { x: 0, y: 0, width: 1, height: 1 };
		expect( getMinZoomForCover( 0, 1, rect ) ).toBeCloseTo( 1 );
	} );
	it( 'requires zoom > 1 for a rotated image', () => {
		const rect = { x: 0, y: 0, width: 1, height: 1 };
		expect( getMinZoomForCover( 45, 1, rect ) ).toBeGreaterThan( 1 );
	} );
	it( 'returns 1 for full crop rect at 90° on landscape image', () => {
		// At 90° rotation the contain-fit already accounts for the rotated
		// bounding box, so zoom=1 should exactly cover the full visual area.
		const rect = { x: 0, y: 0, width: 1, height: 1 };
		expect( getMinZoomForCover( 90, 16 / 9, rect ) ).toBeCloseTo( 1 );
	} );
	it( 'returns 1 for full crop rect at 90° on portrait image', () => {
		const rect = { x: 0, y: 0, width: 1, height: 1 };
		expect( getMinZoomForCover( 90, 9 / 16, rect ) ).toBeCloseTo( 1 );
	} );
	it( 'returns 1 for full crop rect at 270° on landscape image', () => {
		const rect = { x: 0, y: 0, width: 1, height: 1 };
		expect( getMinZoomForCover( 270, 16 / 9, rect ) ).toBeCloseTo( 1 );
	} );
} );

describe( 'restrictPanZoom', () => {
	it( 'returns identity pan at default state', () => {
		const state = makeState();
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( result.crop.x ).toBeCloseTo( 0 );
		expect( result.crop.y ).toBeCloseTo( 0 );
		expect( result.zoom ).toBeCloseTo( 1 );
	} );
	it( 'clamps pan so image covers crop rect', () => {
		const state = makeState( { crop: { x: 5, y: 5 }, zoom: 1 } );
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( Math.abs( result.crop.x ) ).toBeLessThan( 1 );
		expect( Math.abs( result.crop.y ) ).toBeLessThan( 1 );
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
			crop: { x: 0.3, y: 0.3 },
		} );
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( result.crop.x ).toBeCloseTo( 0, 5 );
		expect( result.crop.y ).toBeCloseTo( 0, 5 );
	} );
	it( 'at 90° with zoom=2, allows symmetric pan range', () => {
		// When zoomed in at 90° rotation, the pan range should be symmetric
		// between x and y (both should allow ±0.5 of visual dimension).
		const state90pos = makeState( {
			rotation: 90,
			zoom: 2,
			crop: { x: 0.5, y: 0 },
		} );
		const state90neg = makeState( {
			rotation: 90,
			zoom: 2,
			crop: { x: -0.5, y: 0 },
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
		expect( resultPos.crop.x ).toBeGreaterThan( 0.1 );
		expect( resultNeg.crop.x ).toBeLessThan( -0.1 );
		// And the range should be symmetric.
		expect( resultPos.crop.x ).toBeCloseTo( -resultNeg.crop.x, 5 );
	} );
	it( 'at 0° with zoom=1, allows zero pan on landscape image', () => {
		const state = makeState( {
			rotation: 0,
			zoom: 1,
			crop: { x: 0.3, y: 0.3 },
		} );
		const result = restrictPanZoom( state, IMAGE, state.cropRect );
		expect( result.crop.x ).toBeCloseTo( 0, 5 );
		expect( result.crop.y ).toBeCloseTo( 0, 5 );
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
} );
