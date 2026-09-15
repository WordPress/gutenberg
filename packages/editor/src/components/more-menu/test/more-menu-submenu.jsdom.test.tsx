import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MenuItem } from '@wordpress/components';
import { brush } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import { toMenuItems } from '../more-menu-group';
import MoreMenuSubmenu from '../more-menu-submenu';

describe( 'MoreMenuSubmenu', () => {
	it( 'opens its items from a labelled menu item', async () => {
		const user = userEvent.setup();

		render(
			<Menu.Root>
				<Menu.Trigger>Options</Menu.Trigger>
				<Menu.Popup>
					<MoreMenuSubmenu icon={ brush } label="Panels">
						{ toMenuItems( <MenuItem>Legacy item</MenuItem> ) }
					</MoreMenuSubmenu>
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Options' } ) );

		const trigger = await screen.findByRole( 'menuitem', {
			name: 'Panels',
		} );
		expect( trigger ).toHaveAttribute( 'aria-haspopup', 'menu' );
		expect(
			screen.queryByRole( 'menuitem', { name: 'Legacy item' } )
		).not.toBeInTheDocument();

		await user.click( trigger );

		expect(
			await screen.findByRole( 'menuitem', { name: 'Legacy item' } )
		).toBeVisible();
	} );
} );
