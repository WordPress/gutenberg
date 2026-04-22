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

describe( 'SET_ZOOM during resize', () => {
	it( 'allows zoom < 1 while isResizing', () => {
		const state = makeState( { isResizing: true } );
		const next = cropperReducer( state, {
			type: 'SET_ZOOM',
			payload: 0.6,
		} );
		expect( next.zoom ).toBeCloseTo( 0.6, 5 );
	} );

	it( 'clamps zoom to MIN_ZOOM when not resizing', () => {
		const state = makeState();
		const next = cropperReducer( state, {
			type: 'SET_ZOOM',
			payload: 0.6,
		} );
		expect( next.zoom ).toBe( 1 );
	} );

	it( 'does not overwrite baseZoom while isResizing', () => {
		const state = makeState( {
			isResizing: true,
			zoom: 1.5,
			baseZoom: 1.5,
		} );
		const next = cropperReducer( state, {
			type: 'SET_ZOOM',
			payload: 0.7,
		} );
		expect( next.zoom ).toBeCloseTo( 0.7, 5 );
		expect( next.baseZoom ).toBe( 1.5 );
	} );

	it( 'preserves sub-unit zoom through enforceContainment at a rotation where cover floor > payload', () => {
		// With rotation 45° and a centered square crop, the cover
		// floor (minZoom for restrictPanZoom) is well above 1. If the
		// containment skip in `restrictPanZoom` were missing, the
		// 0.4 payload would be bumped back up to that floor.
		const state = makeState( {
			isResizing: true,
			rotation: 45,
			cropRect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
		} );
		const next = cropperReducer( state, {
			type: 'SET_ZOOM',
			payload: 0.4,
		} );
		expect( next.zoom ).toBeCloseTo( 0.4, 5 );
	} );
} );
