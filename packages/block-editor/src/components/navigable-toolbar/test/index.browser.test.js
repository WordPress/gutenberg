import { describe, expect, it } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { ToolbarItem } from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
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
	it( 'keeps a portaled menu open without remounting the toolbar', async () => {
		await render(
			createElement(
				NavigableToolbar,
				{ 'aria-label': 'Block tools' },
				createElement(
					Menu.Root,
					null,
					createElement( ToolbarItem, null, ( props ) =>
						createElement( Menu.Trigger, props, 'Actions' )
					),
					createElement(
						Menu.Popup,
						null,
						createElement(
							Menu.Item,
							null,
							createElement( Menu.ItemLabel, null, 'Move' )
						)
					)
				)
			)
		);
		const toolbar = screen.getByRole( 'toolbar' );
		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		await userEvent.click( trigger );
		await expect.element( screen.getByRole( 'menu' ) ).toBeVisible();
		expect( screen.getByRole( 'toolbar' ) ).toBe( toolbar );
		await userEvent.keyboard( '{Escape}' );
		await expect.element( trigger ).toHaveFocus();
	} );

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
