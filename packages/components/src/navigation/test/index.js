/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationItem from '../item';
import NavigationMenu from '../menu';

const testNavigation = ( { activeItem, rootTitle, showBadge } = {} ) => (
	<Navigation activeItem={ activeItem }>
		<NavigationMenu title={ rootTitle }>
			<NavigationItem
				badge={ showBadge && 21 }
				item="item-1"
				title="Item 1"
			/>
			<NavigationItem
				href="http://example.com"
				item="item-2"
				target="_blank"
				title="Item 2"
			/>
			<NavigationItem
				navigateToMenu="category"
				item="category"
				title="Category"
			/>
			<NavigationItem item="item-3">
				<span>customize me</span>
			</NavigationItem>
		</NavigationMenu>
		<NavigationMenu
			backButtonLabel="Home"
			menu="category"
			parentMenu="root"
			title="Category"
		>
			<NavigationItem item="child-1" title="Child 1" />
			<NavigationItem item="child-2" title="Child 2" />
		</NavigationMenu>
	</Navigation>
);

describe( 'Navigation', () => {
	it( 'should render the panes and active item', async () => {
		render( testNavigation( { activeItem: 'item-2' } ) );

		const menuItems = screen.getAllByRole( 'listitem' );

		expect( menuItems.length ).toBe( 4 );
		expect( menuItems[ 0 ].textContent ).toBe( 'Item 1' );
		expect( menuItems[ 1 ].textContent ).toBe( 'Item 2' );
		expect( menuItems[ 2 ].textContent ).toBe( 'Category' );
		expect( menuItems[ 3 ].textContent ).toBe( 'customize me' );
		expect( menuItems[ 0 ].classList.contains( 'is-active' ) ).toBe(
			false
		);
		expect( menuItems[ 1 ].classList.contains( 'is-active' ) ).toBe( true );
	} );

	it( 'should render anchor links when menu item supplies an href', async () => {
		render( testNavigation() );

		const linkItem = screen.getByRole( 'link', { name: 'Item 2' } );

		expect( linkItem ).toBeDefined();
		expect( linkItem.target ).toBe( '_blank' );
	} );

	it( 'should render a custom component when menu item supplies one', async () => {
		render( testNavigation() );

		const customItem = screen.getByText( 'customize me' );

		expect( customItem ).toBeDefined();
	} );

	it( 'should set an active category on click', async () => {
		render( testNavigation() );

		fireEvent.click( screen.getByRole( 'button', { name: 'Category' } ) );
		const categoryTitle = screen.getByRole( 'heading' );
		const menuItems = screen.getAllByRole( 'listitem' );

		expect( categoryTitle.textContent ).toBe( 'Category' );
		expect( menuItems.length ).toBe( 2 );
		expect( menuItems[ 0 ].textContent ).toBe( 'Child 1' );
		expect( menuItems[ 1 ].textContent ).toBe( 'Child 2' );
	} );

	it( 'should render the root title', async () => {
		const { rerender } = render( testNavigation() );

		const emptyTitle = screen.queryByRole( 'heading' );
		expect( emptyTitle ).toBeNull();

		rerender( testNavigation( { rootTitle: 'Home' } ) );

		const rootTitle = screen.getByRole( 'heading' );
		expect( rootTitle.textContent ).toBe( 'Home' );
	} );

	it( 'should render badges', async () => {
		render( testNavigation( { showBadge: true } ) );

		const menuItem = screen.getAllByRole( 'listitem' );
		expect( menuItem[ 0 ].textContent ).toBe( 'Item 1' + '21' );
	} );

	it( 'should render menu titles when items exist', async () => {
		const { rerender } = render( <Navigation></Navigation> );

		const emptyMenu = screen.queryByText( 'Menu title' );
		expect( emptyMenu ).toBeNull();

		rerender( testNavigation( { rootTitle: 'Menu title' } ) );

		const menuTitle = screen.queryByText( 'Menu title' );
		expect( menuTitle ).not.toBeNull();
	} );

	it( 'should navigate up a level when clicking the back button', async () => {
		render( testNavigation( { rootTitle: 'Home' } ) );

		fireEvent.click( screen.getByRole( 'button', { name: 'Category' } ) );
		let menuTitle = screen.getByRole( 'heading' );
		expect( menuTitle.textContent ).toBe( 'Category' );
		fireEvent.click( screen.getByRole( 'button', { name: 'Home' } ) );
		menuTitle = screen.getByRole( 'heading' );
		expect( menuTitle.textContent ).toBe( 'Home' );
	} );
} );
