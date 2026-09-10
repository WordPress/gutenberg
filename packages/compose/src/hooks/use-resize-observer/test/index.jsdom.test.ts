import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useResizeObserver from '..';

const disconnect = vi.fn();

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect = disconnect;
}

const originalResizeObserver = globalThis.ResizeObserver;

beforeAll( () => {
	globalThis.ResizeObserver =
		MockResizeObserver as unknown as typeof ResizeObserver;
} );

afterAll( () => {
	globalThis.ResizeObserver = originalResizeObserver;
} );

describe( 'useResizeObserver', () => {
	it( 'disconnects the observer on unmount', () => {
		const { result, unmount } = renderHook( () =>
			useResizeObserver( vi.fn() )
		);

		act( () => result.current( document.createElement( 'div' ) ) );
		expect( disconnect ).not.toHaveBeenCalled();

		unmount();

		expect( disconnect ).toHaveBeenCalledOnce();
	} );
} );
