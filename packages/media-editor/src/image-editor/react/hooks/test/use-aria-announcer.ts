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

	it( 'announces a single-pixel crop change', () => {
		const image = {
			src: 'test.jpg',
			naturalWidth: 2000,
			naturalHeight: 1000,
		};
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{
				initialProps: {
					state: makeState( {
						image,
						cropRect: { x: 0, y: 0, width: 0.5, height: 0.5 },
					} ),
				},
			}
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		// 0.5 → 0.5005 of a 2000px-wide image is a one-pixel change (1000 →
		// 1001), well under the old ~0.5% percentage threshold.
		rerender( {
			state: makeState( {
				image,
				cropRect: { x: 0, y: 0, width: 0.5005, height: 0.5 },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Crop 1001 by 500 pixels' );
	} );

	it( 'does not announce the crop when only zoom changes', () => {
		const image = {
			src: 'test.jpg',
			naturalWidth: 2000,
			naturalHeight: 1000,
		};
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{
				initialProps: {
					state: makeState( {
						image,
						cropRect: { x: 0, y: 0, width: 0.5, height: 0.5 },
					} ),
				},
			}
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( {
				image,
				cropRect: { x: 0, y: 0, width: 0.5, height: 0.5 },
				zoom: 1.5,
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Zoom 150%' );
	} );

	it( 'announces a single-pixel crop change on a rotated non-square image', () => {
		// Portrait image rotated 90°: the announced width scales by the
		// snap-rotation bbox (2000), not naturalWidth (800), so a one-pixel
		// change is 0.0005 of the crop rect — below a naturalWidth-based guard.
		const image = {
			src: 'test.jpg',
			naturalWidth: 800,
			naturalHeight: 2000,
		};
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{
				initialProps: {
					state: makeState( {
						image,
						rotation: 90,
						cropRect: { x: 0, y: 0, width: 0.5, height: 0.5 },
					} ),
				},
			}
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( {
				image,
				rotation: 90,
				cropRect: { x: 0, y: 0, width: 0.5005, height: 0.5 },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Crop 1001 by 400 pixels' );
	} );

	it( 'announces clockwise rotation with direction', () => {
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

	it( 'announces counterclockwise when flip inverts visual direction', () => {
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

		expect( result.current ).toBe( 'Rotated 10 degrees counterclockwise' );
	} );

	it( 'announces a 90° snap under a single flip in visual terms', () => {
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

		// Flip horizontal, then rotate 90° clockwise: the reducer negates the
		// visual direction for the field, so it stores 270 (normalized -90).
		// Visually the user rotated 90° clockwise, so that's what we announce.
		rerender( {
			state: makeState( {
				rotation: 270,
				flip: { horizontal: true, vertical: false },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotated 90 degrees clockwise' );
	} );

	it( 'announces a 90° snap under a vertical flip in visual terms', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{
				initialProps: {
					state: makeState( {
						flip: { horizontal: false, vertical: true },
					} ),
				},
			}
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( {
				rotation: 270,
				flip: { horizontal: false, vertical: true },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotated 90 degrees clockwise' );
	} );

	it( 'announces non-inverted rotation when both axes are flipped', () => {
		// Two mirrors restore handedness (equivalent to a 180° rotation), so
		// the visual direction matches the unflipped case, not the single-flip.
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{
				initialProps: {
					state: makeState( {
						flip: { horizontal: true, vertical: true },
					} ),
				},
			}
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( {
				rotation: 270,
				flip: { horizontal: true, vertical: true },
			} ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotated 90 degrees counterclockwise' );
	} );

	it( 'announces multiple changes with rotation first', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		rerender( {
			state: makeState( { rotation: 90, zoom: 1.5 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe(
			'Rotated 90 degrees clockwise, Zoom 150%'
		);
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

		expect( result.current ).toBe( 'Rotated 105 degrees clockwise' );
	} );

	it( 'announces CCW for 90° snap CCW plus fine CCW adjustment', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		// 90° CCW snap (270°) + 15° CCW fine (255° stored).
		// visualRotation = 255 → normalized to -105.
		rerender( {
			state: makeState( { rotation: 255 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotated 105 degrees counterclockwise' );
	} );

	it( 'announces CCW fine rotation from 0° (stored as 350°)', () => {
		const { result, rerender } = renderHook(
			( { state } ) => useAriaAnnouncer( state ),
			{ initialProps: { state: makeState() } }
		);

		act( () => jest.advanceTimersByTime( 300 ) );

		// -10° from 0° is stored as 350° after normalization.
		// visualRotation = -10 → counterclockwise.
		rerender( {
			state: makeState( { rotation: 350 } ),
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current ).toBe( 'Rotated 10 degrees counterclockwise' );
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
		expect( result.current ).not.toContain( 'Rotated' );
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
