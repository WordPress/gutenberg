import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useDebounce from '../';

describe( 'useDebounce', () => {
	beforeEach( () => {
		vi.useFakeTimers();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'should call the latest function when it changes before the wait time', () => {
		const first = vi.fn();
		const second = vi.fn();
		const { result, rerender } = renderHook(
			( { fn } ) => useDebounce( fn, 100 ),
			{ initialProps: { fn: first } }
		);

		act( () => result.current( 'value' ) );
		rerender( { fn: second } );
		act( () => vi.advanceTimersByTime( 100 ) );

		expect( first ).not.toHaveBeenCalled();
		expect( second ).toHaveBeenCalledTimes( 1 );
		expect( second ).toHaveBeenCalledWith( 'value' );
	} );

	it( 'should cancel scheduled calls on unmount', () => {
		const fn = vi.fn();
		const { result, unmount } = renderHook( () => useDebounce( fn, 100 ) );

		act( () => result.current() );
		unmount();
		act( () => vi.advanceTimersByTime( 100 ) );

		expect( fn ).not.toHaveBeenCalled();
	} );
} );
