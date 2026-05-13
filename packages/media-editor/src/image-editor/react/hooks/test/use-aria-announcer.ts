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
} );
