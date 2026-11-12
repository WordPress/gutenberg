import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CustomGradientBar from '..';

globalThis.wpVitest.mockMatchMedia();

describe( 'CustomGradientBar drag cleanup', () => {
	it.each( [ 1, 2 ] )(
		'removes its drag listeners on unmount after %i drag starts',
		( dragStarts ) => {
			const props = {
				background: 'linear-gradient(90deg, black, white)',
				hasGradient: true,
				value: [
					{ position: 0, color: 'rgb(0,0,0)' },
					{ position: 100, color: 'rgb(255,255,255)' },
				],
				onChange: vi.fn(),
			};
			const { rerender, unmount } = render(
				<CustomGradientBar { ...props } />
			);
			const added = vi.spyOn( window, 'addEventListener' );
			const removed = vi.spyOn( window, 'removeEventListener' );

			try {
				const [ firstPoint ] = screen.getAllByRole( 'button', {
					name: /Gradient control point/,
				} );
				for ( let i = 0; i < dragStarts; i++ ) {
					// Leave the mouse button down so unmount must end the drag.
					fireEvent.mouseDown( firstPoint );
					rerender( <CustomGradientBar { ...props } /> );
				}
				const listeners = added.mock.calls.filter(
					( [ name ] ) => name === 'mousemove' || name === 'mouseup'
				);

				unmount();

				expect( listeners ).toHaveLength( 2 * dragStarts );
				for ( const [ name, listener ] of listeners ) {
					expect( removed ).toHaveBeenCalledWith( name, listener );
				}
			} finally {
				// Avoid leaking global listeners when the regression fails.
				for ( const [ name, listener ] of added.mock.calls ) {
					if ( name === 'mousemove' || name === 'mouseup' ) {
						window.removeEventListener( name, listener );
					}
				}
				added.mockRestore();
				removed.mockRestore();
			}
		}
	);
} );
