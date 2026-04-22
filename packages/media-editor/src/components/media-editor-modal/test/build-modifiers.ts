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
} );
