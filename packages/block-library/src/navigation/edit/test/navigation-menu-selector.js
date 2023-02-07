/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import NavigationMenuSelector from '../navigation-menu-selector';
import useNavigationMenu from '../../use-navigation-menu';

jest.mock( '../../use-navigation-menu', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

describe( 'NavigationMenuSelector', () => {
	describe( 'Toggle', () => {
		it( 'should show dropdown toggle with loading message when menus have not resolved', async () => {
			useNavigationMenu.mockReturnValue( {
				navigationMenus: [],
				isResolvingNavigationMenus: true,
				hasResolvedNavigationMenus: false,
			} );

			render( <NavigationMenuSelector /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-label',
				expect.stringContaining( 'Loading' )
			);
		} );

		it( 'should show dropdown toggle correct prompt when navigation menus have resolved', async () => {
			useNavigationMenu.mockReturnValue( {
				navigationMenus: [],
				isResolvingNavigationMenus: false,
				hasResolvedNavigationMenus: true,
				canUserCreateNavigationMenu: true,
			} );

			render( <NavigationMenuSelector /> );

			const button = screen.getByRole( 'button' );

			expect( button ).toHaveAttribute(
				'aria-label',
				'Choose a Navigation menu'
			);
		} );
	} );

	describe( 'Dropdown', () => {
		it( 'should show in loading state with no options when menus have not resolved', async () => {
			const user = userEvent.setup();

			useNavigationMenu.mockReturnValue( {
				navigationMenus: [],
				isResolvingNavigationMenus: true,
				hasResolvedNavigationMenus: false,
			} );

			render( <NavigationMenuSelector /> );

			const button = screen.getByRole( 'button' );
			await user.click( button );

			const menuPopover = screen.getByRole( 'menu' );
			expect( menuPopover ).toHaveAttribute(
				'aria-label',
				expect.stringContaining( 'Loading' )
			);

			// Check that all the option groups are *not* present.
			const menusGroup = screen.queryByRole( 'group', { name: 'Menus' } );
			expect( menusGroup ).not.toBeInTheDocument();

			const classicMenusGroup = screen.queryByRole( 'group', {
				name: 'Import Classic Menus',
			} );
			expect( classicMenusGroup ).not.toBeInTheDocument();

			const toolsGroup = screen.queryByRole( 'group', {
				name: 'Tools',
			} );
			expect( toolsGroup ).not.toBeInTheDocument();
		} );

		it( 'should only show option to create a menu when no menus exist', async () => {
			const user = userEvent.setup();

			useNavigationMenu.mockReturnValue( {
				navigationMenus: [],
				isResolvingNavigationMenus: false,
				hasResolvedNavigationMenus: true,
				canUserCreateNavigationMenu: true,
			} );

			render( <NavigationMenuSelector /> );

			const button = screen.getByRole( 'button' );
			await user.click( button );

			const menuPopover = screen.getByRole( 'menu' );

			expect( menuPopover ).toHaveAttribute(
				'aria-label',
				expect.stringContaining( 'Choose a Navigation menu' )
			);

			// Check that all the option groups are *not* present.
			const menusGroup = screen.queryByRole( 'group', { name: 'Menus' } );
			expect( menusGroup ).not.toBeInTheDocument();

			const classicMenusGroup = screen.queryByRole( 'group', {
				name: 'Import Classic Menus',
			} );
			expect( classicMenusGroup ).not.toBeInTheDocument();

			const toolsGroup = screen.queryByRole( 'group', {
				name: 'Tools',
			} );
			expect( toolsGroup ).toBeInTheDocument();

			const createMenuButton = screen.getByRole( 'menuitem', {
				name: 'Create new menu',
			} );

			expect( createMenuButton ).toBeInTheDocument();
		} );
	} );
} );
