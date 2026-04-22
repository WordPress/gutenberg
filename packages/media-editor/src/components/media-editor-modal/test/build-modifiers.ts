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
} );
