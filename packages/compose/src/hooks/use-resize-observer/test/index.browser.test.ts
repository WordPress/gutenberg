import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderHook } from 'vitest-browser-react';
import useResizeObserver from '..';

afterEach( () => {
	vi.restoreAllMocks();
} );

describe( 'useResizeObserver', () => {
	it( 'disconnects the observer on unmount', async () => {
		const disconnect = vi.spyOn( ResizeObserver.prototype, 'disconnect' );
		const { result, unmount } = await renderHook( () =>
			useResizeObserver( vi.fn() )
		);

		act( () => result.current( document.createElement( 'div' ) ) );
		expect( disconnect ).not.toHaveBeenCalled();

		await unmount();

		expect( disconnect ).toHaveBeenCalledOnce();
	} );
} );
