import { expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as compose from '@wordpress/compose';
import { useResizeLabel, POSITIONS } from '../utils';

it( 'cancels a pending label fade when removed', () => {
	const sizes = { width: 100, height: 100 };
	const resizeListener = <div />;
	const resizeObserver = vi
		.spyOn( compose, 'useResizeObserver' )
		.mockImplementation( () => [ resizeListener, { ...sizes } ] );
	vi.useFakeTimers();
	const view = renderHook( () =>
		useResizeLabel( {
			fadeTimeout: 180,
			onResize: () => {},
			position: POSITIONS.bottom,
			showPx: false,
		} )
	);

	try {
		sizes.width = 120;
		view.rerender();
		expect( view.result.current.label ).toBe( '120' );
		expect( vi.getTimerCount() ).toBe( 1 );

		view.unmount();
		expect( vi.getTimerCount() ).toBe( 0 );
	} finally {
		view.unmount();
		resizeObserver.mockRestore();
		vi.useRealTimers();
	}
} );
