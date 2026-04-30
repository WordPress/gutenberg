/**
 * Internal dependencies
 */
import { DEFAULT_STATE } from '../constants';
import {
	applyCropGeometryOperation,
	getCropGeometryRange,
	getCropPixelRect,
	type CropGeometryInput,
	type CropperLayoutGeometry,
} from '../crop-geometry';
import type { CropperState, Size } from '../types';

const IMAGE: Size = { width: 1000, height: 500 };
const GEOMETRY: CropperLayoutGeometry = {
	canvasSize: { width: 1000, height: 500 },
	elementSize: { width: 1000, height: 500 },
	visualSize: { width: 1000, height: 500 },
	cropBounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
};

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

function makeInput(
	overrides: Partial< CropGeometryInput > = {}
): CropGeometryInput {
	return {
		state: makeState( {
			cropRect: { x: 0.2, y: 0.2, width: 0.4, height: 0.4 },
		} ),
		imageSize: IMAGE,
		geometry: GEOMETRY,
		freeformCrop: true,
		...overrides,
	};
}

describe( 'crop geometry ranges', () => {
	it( 'computes move-x ranges from the current crop bounds', () => {
		const range = getCropGeometryRange( makeInput(), { type: 'move-x' } );

		expect( range.minValue ).toBeCloseTo( 0 );
		expect( range.maxValue ).toBeCloseTo( 600 );
		expect( range.minDelta ).toBeCloseTo( -200 );
		expect( range.maxDelta ).toBeCloseTo( 400 );
		expect( range.canApply ).toBe( true );
	} );

	it( 'computes move-y ranges from the current crop bounds', () => {
		const range = getCropGeometryRange( makeInput(), { type: 'move-y' } );

		expect( range.minValue ).toBeCloseTo( 0 );
		expect( range.maxValue ).toBeCloseTo( 300 );
		expect( range.minDelta ).toBeCloseTo( -100 );
		expect( range.maxDelta ).toBeCloseTo( 200 );
		expect( range.canApply ).toBe( true );
	} );

	it( 'keeps move-x applicable at a boundary when movement remains possible in the other direction', () => {
		const input = makeInput( {
			state: makeState( {
				cropRect: { x: 0, y: 0.2, width: 0.4, height: 0.4 },
			} ),
		} );
		const range = getCropGeometryRange( input, { type: 'move-x' } );

		expect( range.minDelta ).toBeCloseTo( 0 );
		expect( range.maxDelta ).toBeGreaterThan( 0 );
		expect( range.canApply ).toBe( true );
	} );

	it( 'keeps move-x applicable at the max boundary when movement remains possible in the other direction', () => {
		const input = makeInput( {
			state: makeState( {
				cropRect: { x: 0.6, y: 0.2, width: 0.4, height: 0.4 },
			} ),
		} );
		const range = getCropGeometryRange( input, { type: 'move-x' } );

		expect( range.minDelta ).toBeLessThan( 0 );
		expect( range.maxDelta ).toBeCloseTo( 0 );
		expect( range.canApply ).toBe( true );
	} );

	it( 'computes center-anchored width ranges without aspect-ratio lock', () => {
		const range = getCropGeometryRange( makeInput(), {
			type: 'resize-width',
		} );

		expect( range.minValue ).toBeCloseTo( 50 );
		expect( range.maxValue ).toBeCloseTo( 800 );
		expect( range.minDelta ).toBeCloseTo( -350 );
		expect( range.maxDelta ).toBeCloseTo( 400 );
		expect( range.canApply ).toBe( true );
	} );

	it( 'computes center-anchored height ranges without aspect-ratio lock', () => {
		const range = getCropGeometryRange( makeInput(), {
			type: 'resize-height',
		} );

		expect( range.minValue ).toBeCloseTo( 25 );
		expect( range.maxValue ).toBeCloseTo( 400 );
		expect( range.minDelta ).toBeCloseTo( -175 );
		expect( range.maxDelta ).toBeCloseTo( 200 );
		expect( range.canApply ).toBe( true );
	} );

	it( 'constrains center-anchored width ranges by the paired axis when aspect-ratio locked', () => {
		const input = makeInput( {
			aspectRatio: 1,
			state: makeState( {
				cropRect: { x: 0.2, y: 0.1, width: 0.4, height: 0.8 },
			} ),
		} );
		const range = getCropGeometryRange( input, {
			type: 'resize-width',
		} );

		expect( range.minValue ).toBeCloseTo( 50 );
		expect( range.maxValue ).toBeCloseTo( 500 );
		expect( range.canApply ).toBe( true );
	} );

	it( 'constrains center-anchored height ranges by the paired axis when aspect-ratio locked', () => {
		const input = makeInput( {
			aspectRatio: 1,
			state: makeState( {
				cropRect: { x: 0.2, y: 0.1, width: 0.4, height: 0.8 },
			} ),
		} );
		const range = getCropGeometryRange( input, {
			type: 'resize-height',
		} );

		expect( range.minValue ).toBeCloseTo( 50 );
		expect( range.maxValue ).toBeCloseTo( 500 );
		expect( range.canApply ).toBe( true );
	} );

	it( 'disables resize ranges when freeform crop is off', () => {
		const input = makeInput( { freeformCrop: false } );
		const range = getCropGeometryRange( input, {
			type: 'resize-width',
		} );

		expect( range.minValue ).toBeCloseTo( 400 );
		expect( range.maxValue ).toBeCloseTo( 400 );
		expect( range.canApply ).toBe( false );
	} );
} );

describe( 'applyCropGeometryOperation', () => {
	it( 'clamps out-of-range move values before applying them', () => {
		const input = makeInput();
		const nextRect = applyCropGeometryOperation( input, {
			type: 'move-x',
			value: -999,
		} );

		expect( nextRect?.x ).toBeCloseTo( 0 );
		expect( nextRect?.width ).toBeCloseTo( input.state.cropRect.width );
	} );

	it( 'applies center-anchored resize while preserving aspect ratio', () => {
		const input = makeInput( {
			aspectRatio: 1,
			state: makeState( {
				cropRect: { x: 0.2, y: 0.1, width: 0.4, height: 0.8 },
			} ),
		} );
		const nextRect = applyCropGeometryOperation( input, {
			type: 'resize-width',
			value: 500,
		} );
		const nextState = { ...input.state, cropRect: nextRect! };
		const pixels = getCropPixelRect( nextState, IMAGE );

		expect( pixels.width ).toBeCloseTo( 500 );
		expect( pixels.height ).toBeCloseTo( 500 );
		expect( nextRect?.x + nextRect!.width / 2 ).toBeCloseTo( 0.4 );
		expect( nextRect?.y + nextRect!.height / 2 ).toBeCloseTo( 0.5 );
	} );
} );
