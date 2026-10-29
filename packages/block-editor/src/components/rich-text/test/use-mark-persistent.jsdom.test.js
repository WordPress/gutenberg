import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { StrictMode } from '@wordpress/element';
import { useMarkPersistent } from '../use-mark-persistent';

const markPersistent = vi.fn();

function props( html, text = html, activeFormats = [] ) {
	return {
		html,
		value: { text, activeFormats },
		onMarkPersistent: markPersistent,
	};
}

describe( 'useMarkPersistent', () => {
	beforeEach( () => {
		vi.useFakeTimers();
		markPersistent.mockClear();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'does not mark on mount', () => {
		renderHook( useMarkPersistent, { initialProps: props( 'a' ) } );
		vi.runAllTimers();

		expect( markPersistent ).not.toHaveBeenCalled();
	} );

	it( 'does not mark on mount in strict mode', () => {
		renderHook( useMarkPersistent, {
			initialProps: props( 'a' ),
			wrapper: StrictMode,
		} );
		vi.runAllTimers();

		expect( markPersistent ).not.toHaveBeenCalled();
	} );

	it( 'marks once after a second without typing', () => {
		const { rerender } = renderHook( useMarkPersistent, {
			initialProps: props( 'a' ),
		} );

		rerender( props( 'ab' ) );
		vi.advanceTimersByTime( 500 );
		rerender( props( 'abc' ) );
		vi.advanceTimersByTime( 999 );

		expect( markPersistent ).not.toHaveBeenCalled();

		vi.advanceTimersByTime( 1 );

		expect( markPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'starts the timer for the first character in an empty field', () => {
		const { rerender } = renderHook( useMarkPersistent, {
			initialProps: props( '' ),
		} );

		rerender( props( 'a' ) );
		vi.advanceTimersByTime( 1000 );

		expect( markPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'treats html that lags behind the text as typing', () => {
		const { rerender } = renderHook( useMarkPersistent, {
			initialProps: props( 'a' ),
		} );

		// The text updates first, e.g. when the block debounces
		// `setAttributes`.
		rerender( props( 'a', 'ab' ) );
		rerender( props( 'ab' ) );

		expect( markPersistent ).not.toHaveBeenCalled();

		vi.advanceTimersByTime( 1000 );

		expect( markPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'marks immediately when formatting changes', () => {
		const { rerender } = renderHook( useMarkPersistent, {
			initialProps: props( 'ab' ),
		} );

		rerender( props( '<strong>a</strong>b', 'ab' ) );

		expect( markPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'marks immediately when active formats toggle', () => {
		const { rerender } = renderHook( useMarkPersistent, {
			initialProps: props( 'a' ),
		} );

		rerender( props( 'a', 'a', [ { type: 'core/bold' } ] ) );

		expect( markPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'replaces a pending typing mark with an immediate one', () => {
		const { rerender } = renderHook( useMarkPersistent, {
			initialProps: props( 'a' ),
		} );

		rerender( props( 'ab' ) );
		rerender( props( '<strong>a</strong>b', 'ab' ) );
		vi.runAllTimers();

		expect( markPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls the latest callback without resetting the timer', () => {
		const next = vi.fn();
		const { rerender } = renderHook( useMarkPersistent, {
			initialProps: props( 'a' ),
		} );

		rerender( props( 'ab' ) );
		vi.advanceTimersByTime( 500 );
		rerender( { ...props( 'ab' ), onMarkPersistent: next } );
		vi.advanceTimersByTime( 500 );

		expect( markPersistent ).not.toHaveBeenCalled();
		expect( next ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'cancels a pending mark on unmount', () => {
		const { rerender, unmount } = renderHook( useMarkPersistent, {
			initialProps: props( 'a' ),
		} );

		rerender( props( 'ab' ) );
		unmount();
		vi.runAllTimers();

		expect( markPersistent ).not.toHaveBeenCalled();
	} );
} );
