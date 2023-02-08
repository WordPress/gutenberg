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
import useNavigationEntities from '../../use-navigation-entities';

jest.mock( '../../use-navigation-menu', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

jest.mock( '../../use-navigation-entities', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

useNavigationEntities.mockReturnValue( {
	menus: [],
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

const classicMenusFixture = [
	{
		id: 1,
		name: 'Classic Menu 1',
	},
	{
		id: 2,
		name: 'Classic Menu 2',
	},
	{
		id: 3,
		name: 'Classic Menu 3',
	},
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

			expect(
				screen.getByRole( 'button', {
					name: /Loading/,
				} )
			).toBeInTheDocument();
		} );

		it( 'should show correct dropdown toggle prompt to choose a menu when navigation menus have resolved', async () => {
			useNavigationMenu.mockReturnValue( {
				navigationMenus: [],
				hasResolvedNavigationMenus: true,
				canUserCreateNavigationMenu: true,
				canSwitchNavigationMenu: true,
			} );

			render( <NavigationMenuSelector /> );

			expect(
				screen.getByRole( 'button', {
					name: 'Choose or create a Navigation menu',
				} )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Dropdown', () => {
		it( 'should show in loading state with no options when menus have not resolved and user cannot create menus', async () => {
			const user = userEvent.setup();

			useNavigationMenu.mockReturnValue( {
				navigationMenus: [],
				isResolvingNavigationMenus: true,
				hasResolvedNavigationMenus: false,
				canUserCreateNavigationMenu: false,
				canSwitchNavigationMenu: true,
			} );

			render( <NavigationMenuSelector /> );

			const toggleButton = screen.getByRole( 'button' );
			await user.click( toggleButton );

			expect(
				screen.getByRole( 'menu', {
					name: /Loading/,
				} )
			).toBeInTheDocument();

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

		describe( 'Creating new menus', () => {
			it( 'should show option to create a menu when no menus exist but user can create menus', async () => {
				const user = userEvent.setup();

				useNavigationMenu.mockReturnValue( {
					navigationMenus: [],
					hasResolvedNavigationMenus: true,
					canUserCreateNavigationMenu: true,
					canSwitchNavigationMenu: true,
				} );

				render( <NavigationMenuSelector /> );

				const toggleButton = screen.getByRole( 'button', {
					name: 'Choose or create a Navigation menu',
				} );

				await user.click( toggleButton );

				const menuPopover = screen.getByRole( 'menu' );

				expect( menuPopover ).toHaveAttribute(
					'aria-label',
					expect.stringContaining(
						'Choose or create a Navigation menu'
					)
				);

				// Check that all the option groups are *not* present.
				const menusGroup = screen.queryByRole( 'group', {
					name: 'Menus',
				} );
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
					hasResolvedNavigationMenus: true,
					canUserCreateNavigationMenu: false,
					canSwitchNavigationMenu: true,
				} );

				render( <NavigationMenuSelector /> );

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				// Check the Tools Group and Create Menu Button are present.
				const toolsGroup = screen.queryByRole( 'group', {
					name: 'Tools',
				} );
				expect( toolsGroup ).not.toBeInTheDocument();
			} );

			it( 'should call handler callback and close popover when create menu button is clicked', async () => {
				const user = userEvent.setup();
				const handler = jest.fn();

				useNavigationMenu.mockReturnValue( {
					navigationMenus: [],
					hasResolvedNavigationMenus: true,
					canUserCreateNavigationMenu: true,
					canSwitchNavigationMenu: true,
				} );

				render( <NavigationMenuSelector onCreateNew={ handler } /> );

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				const createMenuButton = screen.getByRole( 'menuitem', {
					name: 'Create new menu',
				} );

				await user.click( createMenuButton );

				expect( handler ).toHaveBeenCalled();

				expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
			} );

			it( 'should handle disabled state of the create menu button during the creation process', async () => {
				const user = userEvent.setup();
				const handler = jest.fn();

				useNavigationMenu.mockReturnValue( {
					navigationMenus: [],
					hasResolvedNavigationMenus: true,
					canUserCreateNavigationMenu: true,
					canSwitchNavigationMenu: true,
				} );

				const { rerender } = render(
					<NavigationMenuSelector onCreateNew={ handler } />
				);

				const toggleButton = screen.getByRole( 'button' );

				await user.click( toggleButton );

				await user.click(
					screen.getByRole( 'menuitem', {
						name: 'Create new menu',
					} )
				);

				// Re-open the dropdown (it's closed when the "Create menu" button is clicked).
				await user.click( toggleButton );

				// Check the dropdown is open again.
				expect( screen.getByRole( 'menu' ) ).toBeInTheDocument();

				// Check the "Create menu" button is disabled.
				expect(
					screen.queryByRole( 'menuitem', {
						name: 'Create new menu',
					} )
				).toBeDisabled();

				// Simulate the menu being created and component being re-rendered.
				rerender(
					<NavigationMenuSelector
						onCreateNew={ handler }
						createNavigationMenuIsSuccess={ true }
					/>
				);

				// Check the button is enabled again.
				expect(
					screen.queryByRole( 'menuitem', {
						name: 'Create new menu',
					} )
				).toBeEnabled();
			} );
		} );

		describe( 'Navigation menus', () => {
			it( 'should not show a list of menus when menus exist but user does not have permission to switch menus', async () => {
				const user = userEvent.setup();

				useNavigationMenu.mockReturnValue( {
					navigationMenus: navigationMenusFixture,
					hasResolvedNavigationMenus: true,
					canUserCreateNavigationMenu: true,
					canSwitchNavigationMenu: false,
				} );

				render( <NavigationMenuSelector /> );

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				const menusGroup = screen.queryByRole( 'group', {
					name: 'Menus',
				} );
				expect( menusGroup ).not.toBeInTheDocument();
			} );

			it( 'should show a list of menus when menus exist', async () => {
				const user = userEvent.setup();

				useNavigationMenu.mockReturnValue( {
					navigationMenus: navigationMenusFixture,
					hasResolvedNavigationMenus: true,
					canUserCreateNavigationMenu: false,
					canSwitchNavigationMenu: true,
				} );

				render( <NavigationMenuSelector /> );

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				const menusGroup = screen.queryByRole( 'group', {
					name: 'Menus',
				} );
				expect( menusGroup ).toBeInTheDocument();

				navigationMenusFixture.forEach( ( item ) => {
					const menuItem = screen.queryByRole( 'menuitemradio', {
						name: item?.title?.rendered,
					} );
					expect( menuItem ).toBeInTheDocument();
				} );
			} );

			it( 'should render fallback title when menu has no title', async () => {
				const user = userEvent.setup();

				const menusWithNoTitle = [
					{
						id: 1,
						status: 'publish',
					},
					{
						id: 2,
						status: 'publish',
					},
				];

				useNavigationMenu.mockReturnValue( {
					navigationMenus: menusWithNoTitle,
					hasResolvedNavigationMenus: true,
					canUserCreateNavigationMenu: true,
					canSwitchNavigationMenu: true,
				} );

				render( <NavigationMenuSelector /> );

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				const menusGroup = screen.queryByRole( 'group', {
					name: 'Menus',
				} );
				expect( menusGroup ).toBeInTheDocument();

				// Check for sequentially named fallback titles.
				expect(
					screen.getByRole( 'menuitemradio', {
						name: '(no title 1)',
					} )
				).toBeInTheDocument();

				expect(
					screen.getByRole( 'menuitemradio', {
						name: '(no title 2)',
					} )
				).toBeInTheDocument();
			} );

			it( 'should correctly call handler when navigation menu item is clicked', async () => {
				const user = userEvent.setup();

				const clickHandler = jest.fn();

				useNavigationMenu.mockReturnValue( {
					navigationMenus: navigationMenusFixture,
					hasResolvedNavigationMenus: true,
					canUserCreateNavigationMenu: true,
					canSwitchNavigationMenu: true,
				} );

				render(
					<NavigationMenuSelector
						onSelectNavigationMenu={ clickHandler }
					/>
				);

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				const menuItem = screen.getByRole( 'menuitemradio', {
					name: navigationMenusFixture[ 0 ].title.rendered,
				} );

				await user.click( menuItem );

				expect( clickHandler ).toHaveBeenCalledWith(
					navigationMenusFixture[ 0 ].id
				);
			} );

			it( 'should pre-select the correct menu in the menu list if a menu ID is passed', async () => {
				const user = userEvent.setup();

				useNavigationMenu.mockReturnValue( {
					navigationMenus: navigationMenusFixture,
					hasResolvedNavigationMenus: true,
					canUserCreateNavigationMenu: true,
					canSwitchNavigationMenu: true,
				} );

				render(
					<NavigationMenuSelector
						currentMenuId={ navigationMenusFixture[ 0 ].id }
					/>
				);

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				const menuItem = screen.getByRole( 'menuitemradio', {
					name: navigationMenusFixture[ 0 ].title.rendered,
				} );

				expect( menuItem ).toBeChecked();
			} );
		} );

		describe( 'Classic menus', () => {
			it( 'should not show classic menus if there are no classic menus', async () => {
				const user = userEvent.setup();

				useNavigationEntities.mockReturnValue( {
					menus: [],
				} );

				render( <NavigationMenuSelector /> );

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				const classicMenusGroup = screen.queryByRole( 'group', {
					name: 'Import Classic Menus',
				} );
				expect( classicMenusGroup ).not.toBeInTheDocument();
			} );

			it( 'should not show classic menus if there are classic menus but the user does not have permission to create menus', async () => {
				const user = userEvent.setup();

				useNavigationMenu.mockReturnValue( {
					canUserCreateNavigationMenu: false,
				} );

				useNavigationEntities.mockReturnValue( {
					menus: classicMenusFixture,
				} );

				render( <NavigationMenuSelector /> );

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				const classicMenusGroup = screen.queryByRole( 'group', {
					name: 'Import Classic Menus',
				} );
				expect( classicMenusGroup ).not.toBeInTheDocument();
			} );

			it( 'should show classic menus if there are classic menus and the user has permission to create menus', async () => {
				const user = userEvent.setup();

				useNavigationMenu.mockReturnValue( {
					canUserCreateNavigationMenu: true,
				} );

				useNavigationEntities.mockReturnValue( {
					menus: classicMenusFixture,
				} );

				render( <NavigationMenuSelector /> );

				const toggleButton = screen.getByRole( 'button' );
				await user.click( toggleButton );

				const classicMenusGroup = screen.queryByRole( 'group', {
					name: 'Import Classic Menus',
				} );

				expect( classicMenusGroup ).toBeInTheDocument();

				// Check for classic menuitem roles
				expect(
					screen.getByRole( 'menuitem', {
						name: `Create from '${ classicMenusFixture[ 0 ].name }'`,
					} )
				).toBeInTheDocument();

				classicMenusFixture.forEach( ( item ) => {
					const menuItem = screen.getByRole( 'menuitem', {
						name: `Create from '${ item.name }'`,
					} );
					expect( menuItem ).toBeInTheDocument();
				} );
			} );
		} );
	} );
} );
