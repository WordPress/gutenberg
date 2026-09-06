import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { MenuItem } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import MoreMenuItem from '../more-menu-item';
import MoreMenuGroup from '../more-menu-group';

// `MenuItem` renders a `Button`, which turns into a link given an address.
// Neither of them declares `href` among its props.
const LinkMenuItem = MenuItem as ComponentType<
	ComponentProps< typeof MenuItem > & { href: string }
>;

function renderMenu( children: ReactNode ) {
	return render(
		<Menu.Root>
			<Menu.Trigger>Options</Menu.Trigger>
			<Menu.Popup>
				<MoreMenuGroup label="Panels">{ children }</MoreMenuGroup>
			</Menu.Popup>
		</Menu.Root>
	);
}

async function openMenu( user: UserEvent ) {
	await user.click( screen.getByRole( 'button', { name: 'Options' } ) );
	await screen.findByRole( 'menu' );
}

describe( 'MoreMenuGroup', () => {
	it( 'adopts legacy menu items as menu items', async () => {
		const user = userEvent.setup();
		const onClick = jest.fn();

		renderMenu( <MenuItem onClick={ onClick }>Legacy item</MenuItem> );
		await openMenu( user );

		const item = screen.getByRole( 'menuitem', { name: 'Legacy item' } );

		await user.keyboard( '{ArrowDown}' );
		expect( item ).toHaveFocus();

		await user.keyboard( '{Enter}' );
		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the info of legacy menu items', async () => {
		const user = userEvent.setup();

		renderMenu(
			<MenuItem info="Legacy description">Legacy item</MenuItem>
		);
		await openMenu( user );

		expect(
			screen.getByRole( 'menuitem', {
				name: 'Legacy item Legacy description',
			} )
		).toBeInTheDocument();
	} );

	it( 'adopts legacy link items as link items', async () => {
		const user = userEvent.setup();

		renderMenu(
			<LinkMenuItem href="https://wordpress.org">
				Legacy link
			</LinkMenuItem>
		);
		await openMenu( user );

		expect(
			screen.getByRole( 'menuitem', { name: 'Legacy link' } )
		).toHaveAttribute( 'href', 'https://wordpress.org' );
	} );

	it( 'adopts a legacy link item of an empty address as a link item', async () => {
		const user = userEvent.setup();

		renderMenu( <LinkMenuItem href="">Legacy link</LinkMenuItem> );
		await openMenu( user );

		expect(
			screen.getByRole( 'menuitem', { name: 'Legacy link' } )
		).toHaveAttribute( 'href', '' );
	} );

	it( 'skips fills rendering nothing', async () => {
		const user = userEvent.setup();
		const NothingMenuItem = forwardRef( () => null );

		renderMenu( [
			<NothingMenuItem key="nothing" />,
			<MenuItem key="legacy">Legacy item</MenuItem>,
		] );
		await openMenu( user );

		await user.keyboard( '{ArrowDown}' );
		expect(
			screen.getByRole( 'menuitem', { name: 'Legacy item' } )
		).toHaveFocus();
	} );

	it( 'leaves more menu items alone', async () => {
		const user = userEvent.setup();

		renderMenu( <MoreMenuItem>Plugin item</MoreMenuItem> );
		await openMenu( user );

		expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 1 );
	} );
} );
