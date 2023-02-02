/**
 * External dependencies
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { arrowLeft, arrowRight, arrowUp, arrowDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DropdownMenu from '../';
import { MenuItem } from '../../';

describe( 'DropdownMenu', () => {
	it( 'should not render when neither controls nor children are assigned', () => {
		render( <DropdownMenu /> );

		// The button toggle should not even be rendered
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'should not render when controls are empty and children is not specified', () => {
		render( <DropdownMenu controls={ [] } /> );

		// The button toggle should not even be rendered
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'should open menu when pressing arrow down on the toggle and the controls prop is used to define menu items', async () => {
		const user = userEvent.setup();

		const controls = [
			{
				title: 'Up',
				icon: arrowUp,
				onClick: jest.fn(),
			},
			{
				title: 'Right',
				icon: arrowRight,
				onClick: jest.fn(),
			},
			{
				title: 'Down',
				icon: arrowDown,
				onClick: jest.fn(),
			},
			{
				title: 'Left',
				icon: arrowLeft,
				onClick: jest.fn(),
			},
		];

		render( <DropdownMenu controls={ controls } /> );

		// Move focus on the toggle button
		await user.tab();

		await user.keyboard( '[ArrowDown]' );

		const menu = screen.getByRole( 'menu' );

		// we need to wait because showing the dropdown is animated
		await waitFor( () => expect( menu ).toBeVisible() );

		expect( within( menu ).getAllByRole( 'menuitem' ) ).toHaveLength(
			controls.length
		);
	} );

	it( 'should open menu when pressing arrow down on the toggle and the children prop is used to define menu items', async () => {
		const user = userEvent.setup();

		render(
			<DropdownMenu
				children={ ( { onClose } ) => <MenuItem onClick={ onClose } /> }
			/>
		);

		// Move focus on the toggle button
		await user.tab();

		await user.keyboard( '[ArrowDown]' );

		const menu = screen.getByRole( 'menu' );

		// we need to wait because showing the dropdown is animated
		await waitFor( () => expect( menu ).toBeVisible() );

		// Clicking the menu item will close the dropdown menu
		await user.click( within( menu ).getByRole( 'menuitem' ) );

		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
	} );
} );
