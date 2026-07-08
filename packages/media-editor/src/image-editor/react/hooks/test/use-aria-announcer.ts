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

	it( 'announces visual rotation when rotation changes', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( { rotation: 15 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotation 15 degrees' );
	} );

	it( 'announces negative visual rotation with single-axis flip', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{
				initialProps: {
					state: makeState( {
						flip: { horizontal: true, vertical: false },
					} ),
				},
			}
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		// With a single-axis flip, rotation 10 appears as -10 visually.
		rerender( {
			state: makeState( {
				rotation: 10,
				flip: { horizontal: true, vertical: false },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotation -10 degrees' );
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

	it( 'announces rotation after 90° snap plus fine adjustment', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		// 90° CW snap + 15° fine = 105° stored.
		rerender( {
			state: makeState( { rotation: 105 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotation 105 degrees' );
	} );

	it( 'announces CCW fine rotation from 0° (stored as 350°)', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		// -10° from 0° is stored as 350° after normalization.
		// baseAngle = round(350/90)*90 = 360 → 360%360 = 0
		// offset = 350 - 360 = -10, visualRotation = 0 + (-10) = -10
		rerender( {
			state: makeState( { rotation: 350 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotation -10 degrees' );
	} );

	it( 'suppresses unchanged values in combined announcements', () => {
		const image = {
			src: 'test.jpg',
			naturalWidth: 1000,
			naturalHeight: 800,
		};
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{
				initialProps: {
					state: makeState( { image, rotation: 15 } ),
				},
			}
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		// Only change crop — zoom and rotation should be suppressed.
		rerender( {
			state: makeState( {
				image,
				rotation: 15,
				cropRect: { x: 0, y: 0, width: 0.5, height: 0.5 },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Crop 500 by 400 pixels' );
		expect( result.current ).not.toContain( 'Zoom' );
		expect( result.current ).not.toContain( 'Rotation' );
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
