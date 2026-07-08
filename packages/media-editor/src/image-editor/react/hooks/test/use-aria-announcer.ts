/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useAriaAnnouncer } from '../use-aria-announcer';
import { DEFAULT_STATE } from '../../../core/constants';
import type { CropperState } from '../../../core/types';

function makeState( overrides: Partial< CropperState > = {} ): CropperState {
	return {
		...DEFAULT_STATE,
		...overrides,
		cropRect: {
			...DEFAULT_STATE.cropRect,
			...overrides.cropRect,
		},
		flip: {
			...DEFAULT_STATE.flip,
			...overrides.flip,
		},
	};
}

describe( 'useAriaAnnouncer', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'announces horizontal flip changes', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( {
				flip: { horizontal: true, vertical: false },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Flipped horizontally' );

		rerender( {
			state: makeState( {
				flip: { horizontal: false, vertical: false },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Flip removed' );
	} );

	it( 'announces combined flip state when both axes are active', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( {
				flip: { horizontal: true, vertical: true },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Flipped horizontally and vertically' );
	} );

	it( 'announces crop in pixels when image dimensions are available', () => {
		const image = {
			src: 'test.jpg',
			naturalWidth: 1000,
			naturalHeight: 800,
		};
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState( { image } ) } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( {
				image,
				cropRect: { x: 0, y: 0, width: 0.8, height: 0.5 },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Crop 800 by 400 pixels' );
	} );

	it( 'falls back to percentages when image is not loaded', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( {
				cropRect: { x: 0, y: 0, width: 0.8, height: 0.95 },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Crop width 80%, height 95%' );
	} );

	it( 'announces only rotation with direction when only rotation changes', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( { rotation: 15 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotated 15 degrees clockwise' );
	} );

	it( 'announces counterclockwise rotation for shortest-arc CCW changes', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		// 0 → 350 is a -10° shortest-arc delta (counterclockwise).
		rerender( {
			state: makeState( { rotation: 350 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotated 10 degrees counterclockwise' );
	} );

	it( 'announces rotation back to zero', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState( { rotation: 15 } ) } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( { rotation: 0 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotation 0 degrees' );
	} );

	it( 'announces only zoom when only zoom changes', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( { zoom: 1.5 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Zoom 150%' );
	} );
} );
