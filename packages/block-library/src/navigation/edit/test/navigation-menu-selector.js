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

const navigationMenu1 = {
	id: 1,
	title: {
		rendered: 'Menu 1',
	},
	status: 'publish',
};
const navigationMenu2 = {
	id: 2,
	title: {
		rendered: 'Menu 2',
	},
	status: 'publish',
};
const navigationMenu3 = {
	id: 3,
	title: {
		rendered: 'Menu 3',
	},
	status: 'publish',
};
const navigationMenusFixture = [
	navigationMenu1,
	navigationMenu2,
	navigationMenu3,
];

describe( 'NavigationMenuSelector', () => {
	describe( 'Toggle', () => {
		it( 'should show dropdown toggle with loading message when menus have not resolved', async () => {
			useNavigationMenu.mockReturnValue( {
				navigationMenus: [],
				isResolvingNavigationMenus: true,
				hasResolvedNavigationMenus: false,
				canSwitchNavigationMenu: true,
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
				canSwitchNavigationMenu: true,
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
				canSwitchNavigationMenu: true,
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
				canSwitchNavigationMenu: true,
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

			// Check the Tools Group and Create Menu Button are present.
			const toolsGroup = screen.queryByRole( 'group', {
				name: 'Tools',
			} );
			expect( toolsGroup ).toBeInTheDocument();

			const createMenuButton = screen.getByRole( 'menuitem', {
				name: 'Create new menu',
			} );

			expect( createMenuButton ).toBeInTheDocument();
		} );

		it( 'should not show option to create a menu when user does not have permission to create menus', async () => {
			const user = userEvent.setup();

			useNavigationMenu.mockReturnValue( {
				navigationMenus: [],
				isResolvingNavigationMenus: false,
				hasResolvedNavigationMenus: true,
				canUserCreateNavigationMenu: false,
				canSwitchNavigationMenu: true,
			} );

			render( <NavigationMenuSelector /> );

			const button = screen.getByRole( 'button' );
			await user.click( button );

			// Check the Tools Group and Create Menu Button are present.
			const toolsGroup = screen.queryByRole( 'group', {
				name: 'Tools',
			} );
			expect( toolsGroup ).not.toBeInTheDocument();
		} );

		it( 'should show a list of menus when menus exist', async () => {
			const user = userEvent.setup();

			useNavigationMenu.mockReturnValue( {
				navigationMenus: navigationMenusFixture,
				isResolvingNavigationMenus: false,
				hasResolvedNavigationMenus: true,
				canUserCreateNavigationMenu: false,
				canSwitchNavigationMenu: true,
			} );

			render( <NavigationMenuSelector /> );

			const button = screen.getByRole( 'button' );
			await user.click( button );

			navigationMenusFixture.forEach( ( item ) => {
				const menuItem = screen.queryByRole( 'menuitemradio', {
					name: item?.title?.rendered,
				} );
				expect( menuItem ).toBeInTheDocument();
			} );
		} );
	} );
} );
