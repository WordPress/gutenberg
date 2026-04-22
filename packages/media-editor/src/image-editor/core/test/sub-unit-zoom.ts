/**
 * Sub-unit zoom regime — the transient state entered during a handle-driven
 * resize drag where the image can render below classic contain-fit.
 *
 * Parity with the committed-state domain (zoom ≥ 1) is covered by
 * `preview-export-parity.ts`. This file covers only the sub-unit path:
 * begin → grow crop past 1.0 → end → settle → back in the normal domain.
 */
import { DEFAULT_STATE } from '../constants';
import { cropperReducer } from '../state';
import type { CropperState, Size } from '../types';

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

describe( 'BEGIN_RESIZE / END_RESIZE', () => {
	it( 'BEGIN_RESIZE sets isResizing without touching pan/zoom/crop', () => {
		const state = makeState( {
			zoom: 1.5,
			pan: { x: 0.1, y: -0.2 },
			cropRect: { x: 0.2, y: 0.2, width: 0.5, height: 0.5 },
		} );
		const next = cropperReducer( state, { type: 'BEGIN_RESIZE' } );
		expect( next.isResizing ).toBe( true );
		expect( next.zoom ).toBe( state.zoom );
		expect( next.pan ).toEqual( state.pan );
		expect( next.cropRect ).toEqual( state.cropRect );
	} );

	it( 'END_RESIZE clears isResizing without touching pan/zoom/crop', () => {
		const state = makeState( {
			isResizing: true,
			zoom: 0.75,
			pan: { x: 0.1, y: -0.2 },
			cropRect: { x: 0.2, y: 0.2, width: 0.5, height: 0.5 },
		} );
		const next = cropperReducer( state, { type: 'END_RESIZE' } );
		expect( next.isResizing ).toBe( false );
		expect( next.zoom ).toBe( 0.75 );
		expect( next.pan ).toEqual( state.pan );
		expect( next.cropRect ).toEqual( state.cropRect );
	} );
} );
