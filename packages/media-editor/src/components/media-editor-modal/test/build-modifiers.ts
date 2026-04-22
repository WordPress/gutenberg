/**
 * Internal dependencies
 */
import { buildModifiers } from '../build-modifiers';
import { DEFAULT_STATE } from '../../../image-editor/core/constants';
import type { CropperState, Size } from '../../../image-editor';

const IMAGE: Size = { width: 1600, height: 900 };

function stateWith( overrides: Partial< CropperState > = {} ): CropperState {
	const merged: CropperState = {
		...DEFAULT_STATE,
		image: {
			src: 'test.jpg',
			naturalWidth: IMAGE.width,
			naturalHeight: IMAGE.height,
		},
		...overrides,
	};
	// Mirror the base-field defaults used elsewhere in the image-editor tests:
	// base = live when overrides don't specify base explicitly.
	if ( overrides.baseZoom === undefined ) {
		merged.baseZoom = merged.zoom;
	}
	if ( overrides.basePan === undefined ) {
		merged.basePan = { ...merged.pan };
	}
	if ( overrides.baseRotation === undefined ) {
		merged.baseRotation = merged.rotation;
	}
	return merged;
}

describe( 'buildModifiers', () => {
	it( 'returns an empty array for an identity state', () => {
		const modifiers = buildModifiers( stateWith(), IMAGE );
		expect( modifiers ).toEqual( [] );
	} );

	it( 'emits a flip modifier when horizontal flip is set', () => {
		const modifiers = buildModifiers(
			stateWith( { flip: { horizontal: true, vertical: false } } ),
			IMAGE
		);
		expect( modifiers ).toEqual( [
			{
				type: 'flip',
				args: { flip: { horizontal: true, vertical: false } },
			},
		] );
	} );

	it( 'emits a flip modifier when vertical flip is set', () => {
		const modifiers = buildModifiers(
			stateWith( { flip: { horizontal: false, vertical: true } } ),
			IMAGE
		);
		expect( modifiers ).toEqual( [
			{
				type: 'flip',
				args: { flip: { horizontal: false, vertical: true } },
			},
		] );
	} );

	it( 'emits a flip modifier with both axes', () => {
		const modifiers = buildModifiers(
			stateWith( { flip: { horizontal: true, vertical: true } } ),
			IMAGE
		);
		expect( modifiers ).toEqual( [
			{
				type: 'flip',
				args: { flip: { horizontal: true, vertical: true } },
			},
		] );
	} );

	it( 'omits flip when both axes are false', () => {
		const modifiers = buildModifiers(
			stateWith( { flip: { horizontal: false, vertical: false } } ),
			IMAGE
		);
		expect( modifiers ).toEqual( [] );
	} );

	it( 'emits a rotate modifier at 90°', () => {
		const modifiers = buildModifiers(
			stateWith( { rotation: 90 } ),
			IMAGE
		);
		expect( modifiers ).toEqual( [
			{ type: 'rotate', args: { angle: 90 } },
		] );
	} );

	it( 'emits a rotate modifier at a non-cardinal angle', () => {
		const modifiers = buildModifiers(
			stateWith( { rotation: 45 } ),
			IMAGE
		);
		expect( modifiers ).toEqual( [
			{ type: 'rotate', args: { angle: 45 } },
		] );
	} );

	it( 'normalizes rotation to [0, 360) and drops 360°', () => {
		const modifiers = buildModifiers(
			stateWith( { rotation: 360 } ),
			IMAGE
		);
		expect( modifiers ).toEqual( [] );
	} );

	it( 'normalizes negative rotation', () => {
		const modifiers = buildModifiers(
			stateWith( { rotation: -90 } ),
			IMAGE
		);
		expect( modifiers ).toEqual( [
			{ type: 'rotate', args: { angle: 270 } },
		] );
	} );

	it( 'emits flip before rotate when both are set', () => {
		const modifiers = buildModifiers(
			stateWith( {
				flip: { horizontal: true, vertical: false },
				rotation: 90,
			} ),
			IMAGE
		);
		expect( modifiers ).toEqual( [
			{
				type: 'flip',
				args: { flip: { horizontal: true, vertical: false } },
			},
			{ type: 'rotate', args: { angle: 90 } },
		] );
	} );

	it( 'emits a crop modifier when the crop rect covers half the image', () => {
		const modifiers = buildModifiers(
			stateWith( {
				cropRect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
			} ),
			IMAGE
		);
		expect( modifiers ).toHaveLength( 1 );
		expect( modifiers[ 0 ].type ).toBe( 'crop' );
		const args = (
			modifiers[ 0 ] as {
				args: {
					left: number;
					top: number;
					width: number;
					height: number;
				};
			}
		 ).args;
		expect( args.width ).toBeCloseTo( 50 );
		expect( args.height ).toBeCloseTo( 50 );
		expect( args.left ).toBeCloseTo( 25 );
		expect( args.top ).toBeCloseTo( 25 );
	} );

	it( 'emits crop args relative to the rotated canvas when rotation is set', () => {
		// A 50%-wide crop at rotation=90 should yield width=50% of the
		// post-rotation canvas, NOT 50% of the original source width
		// (which would be `0.5 * rotW / imageSize.width * 100` = 28.125
		// for a 1600×900 image). The REST `/edit` endpoint applies
		// modifiers sequentially, so by the time `crop` runs the image
		// has been rotated to 900×1600 and percentages are against that
		// frame.
		const modifiers = buildModifiers(
			stateWith( {
				rotation: 90,
				cropRect: { x: 0, y: 0, width: 0.5, height: 1 },
			} ),
			IMAGE
		);
		expect( modifiers ).toHaveLength( 2 );
		expect( modifiers[ 0 ] ).toEqual( {
			type: 'rotate',
			args: { angle: 90 },
		} );
		expect( modifiers[ 1 ].type ).toBe( 'crop' );
		const args = (
			modifiers[ 1 ] as {
				args: {
					left: number;
					top: number;
					width: number;
					height: number;
				};
			}
		 ).args;
		expect( args.width ).toBeCloseTo( 50 );
		expect( args.height ).toBeCloseTo( 100 );
		expect( args.left ).toBeCloseTo( 0 );
		expect( args.top ).toBeCloseTo( 0 );
	} );

	it( 'emits crop args adjusted for zoom and pan', () => {
		// At zoom=2 with pan at origin, the image is scaled 2x around
		// the rotated-canvas center, so a cropRect centered on the
		// stencil corresponds to a source region half as wide. For
		// cropRect={0.25, 0.25, 0.5, 0.5}:
		//   width  = 0.5 * 100 / 2 = 25
		//   left   = (0.25 + 1 - 0.5 - 0) * 100 / 2 = 37.5
		const modifiers = buildModifiers(
			stateWith( {
				zoom: 2,
				cropRect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
			} ),
			IMAGE
		);
		expect( modifiers ).toHaveLength( 1 );
		expect( modifiers[ 0 ].type ).toBe( 'crop' );
		const args = (
			modifiers[ 0 ] as {
				args: {
					left: number;
					top: number;
					width: number;
					height: number;
				};
			}
		 ).args;
		expect( args.width ).toBeCloseTo( 25 );
		expect( args.height ).toBeCloseTo( 25 );
		expect( args.left ).toBeCloseTo( 37.5 );
		expect( args.top ).toBeCloseTo( 37.5 );
	} );

	it( 'omits crop when the crop rect is full-frame within tolerance', () => {
		// 99.95% on each axis is within the 0.1% tolerance.
		const modifiers = buildModifiers(
			stateWith( {
				cropRect: {
					x: 0.00025,
					y: 0.00025,
					width: 0.9995,
					height: 0.9995,
				},
			} ),
			IMAGE
		);
		expect( modifiers ).toEqual( [] );
	} );

	it( 'emits flip, rotate, and crop in that order', () => {
		const modifiers = buildModifiers(
			stateWith( {
				flip: { horizontal: true, vertical: false },
				rotation: 90,
				cropRect: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
			} ),
			IMAGE
		);
		expect( modifiers.map( ( m ) => m.type ) ).toEqual( [
			'flip',
			'rotate',
			'crop',
		] );
	} );

	it( 'returns an empty array for a zero-size image', () => {
		const modifiers = buildModifiers(
			stateWith( {
				cropRect: { x: 0, y: 0, width: 0.5, height: 0.5 },
			} ),
			{ width: 0, height: 0 }
		);
		expect( modifiers ).toEqual( [] );
	} );
} );
