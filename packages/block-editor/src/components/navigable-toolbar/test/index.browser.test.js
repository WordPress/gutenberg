import { describe, expect, it } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { createElement } from '@wordpress/element';
import NavigableToolbar from '..';

function createToolbar( { hidden = false, extraChildren = 0 } = {} ) {
	return createElement(
		'div',
		hidden ? { style: { visibility: 'hidden' } } : null,
		createElement(
			NavigableToolbar,
			{ 'aria-label': 'Block tools' },
			createElement( 'button', null, 'Custom control' ),
			...Array.from( { length: extraChildren }, ( _, index ) =>
				createElement( 'span', { key: index } )
			)
		)
	);
}

describe( 'NavigableToolbar', () => {
	it( 'does not reclassify a visibility-hidden toolbar when its subtree changes', async () => {
		const { rerender } = await render( createToolbar() );
		const initialToolbar = screen.getByRole( 'toolbar' );

		await rerender( createToolbar( { extraChildren: 1 } ) );

		await waitFor( () => {
			expect( screen.getByRole( 'toolbar' ) ).not.toBe( initialToolbar );
		} );
		expect( console ).toHaveWarned();
		const toolbar = screen.getByRole( 'toolbar' );

		await rerender( createToolbar( { hidden: true, extraChildren: 2 } ) );

		await act(
			() =>
				new Promise( ( resolve ) =>
					window.requestAnimationFrame( () =>
						window.requestAnimationFrame( resolve )
					)
				)
		);
		expect( screen.getByRole( 'toolbar', { hidden: true } ) ).toBe(
			toolbar
		);
	} );
} );
