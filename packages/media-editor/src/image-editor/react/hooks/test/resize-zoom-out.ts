/**
 * Integration: the full dispatch chain through `useCropperState` when
 * the user drags a freeform crop handle outward.
 *
 * Covers what the unit tests in `core/test/sub-unit-zoom.ts` cannot —
 * that dispatching BEGIN_RESIZE followed by successive SET_CROP_RECT +
 * SET_ZOOM pairs via the hook's `__dispatch` yields a sub-unit zoom,
 * and that END_RESIZE + `settleCrop` restores `zoom >= 1` and clears
 * the flag.
 */

/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useCropperState } from '../use-cropper-state';

describe( 'handle-driven zoom-out integration', () => {
	it( 'drops zoom below 1 as the east edge grows past the image', () => {
		const { result } = renderHook( () => useCropperState() );

		act( () => {
			result.current.setImage( {
				src: 'test.jpg',
				naturalWidth: 1600,
				naturalHeight: 900,
			} );
		} );

		// Start from a centered crop.
		act( () => {
			result.current.setCropRect( {
				x: 0.25,
				y: 0.25,
				width: 0.5,
				height: 0.5,
			} );
		} );

		act( () => {
			result.current.__dispatch( { type: 'BEGIN_RESIZE' } );
		} );

		// Simulate the cropper's handleCropChange path: combined crop +
		// zoom dispatch via `__dispatch`. This isolates reducer behavior
		// from the component.
		act( () => {
			result.current.__dispatch( {
				type: 'SET_CROP_RECT',
				payload: { x: 0.1, y: 0.25, width: 0.9, height: 0.5 },
			} );
			result.current.__dispatch( {
				type: 'SET_ZOOM',
				payload: 0.95 / 0.9,
			} );
		} );
		// Grown further — past the point where zoom must go below 1.
		act( () => {
			result.current.__dispatch( {
				type: 'SET_CROP_RECT',
				payload: { x: 0.0, y: 0.2, width: 1.0, height: 0.6 },
			} );
			result.current.__dispatch( {
				type: 'SET_ZOOM',
				payload: 0.95 / 1.0,
			} );
		} );

		expect( result.current.state.zoom ).toBeLessThan( 1 );
		expect( result.current.state.isResizing ).toBe( true );

		// Release: settle should restore the invariant.
		act( () => {
			result.current.__dispatch( { type: 'END_RESIZE' } );
			result.current.settleCrop();
		} );
		expect( result.current.state.zoom ).toBeGreaterThanOrEqual( 1 );
		expect( result.current.state.isResizing ).toBe( false );
	} );
} );
