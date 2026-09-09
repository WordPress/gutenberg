import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useResizeObserver from '..';

afterEach( () => {
	vi.restoreAllMocks();
} );

describe( 'useResizeObserver', () => {
	it( 'disconnects the observer on unmount', () => {
		const disconnect = vi.spyOn( ResizeObserver.prototype, 'disconnect' );
		const { result, unmount } = renderHook( () =>
			useResizeObserver( vi.fn() )
		);

		act( () => result.current( document.createElement( 'div' ) ) );
		expect( disconnect ).not.toHaveBeenCalled();

		unmount();

		expect( disconnect ).toHaveBeenCalledOnce();
	} );
} );
