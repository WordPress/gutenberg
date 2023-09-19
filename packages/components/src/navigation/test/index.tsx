/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationItem from '../item';
import NavigationMenu from '../menu';

const TestNavigation = ( {
	activeItem,
	rootTitle,
	showBadge,
}: {
	activeItem?: string;
	rootTitle?: string;
	showBadge?: boolean;
} ) => (
	<Navigation activeItem={ activeItem }>
		<NavigationMenu title={ rootTitle }>
			<NavigationItem
				badge={ showBadge ? 21 : undefined }
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

const TestNavigationControlled = () => {
	const [ activeItem, setActiveItem ] = useState( 'item-1' );
	const [ activeMenu, setActiveMenu ] = useState( 'root' );

	const onMockLinkClick: React.MouseEventHandler< HTMLAnchorElement > = (
		event
	) => {
		event.preventDefault();
		const item = ( event.target as HTMLAnchorElement ).href.replace(
			'https://example.com/',
			''
		);
		setActiveItem( item );
	};

	return (
		<>
			<Navigation
				activeItem={ activeItem }
				activeMenu={ activeMenu }
				className="navigation-story"
				onActivateMenu={ setActiveMenu }
			>
				<NavigationMenu title="Home">
					<NavigationItem
						item="item-1"
						title="Item 1"
						href="https://example.com/item-1"
						onClick={ onMockLinkClick }
					/>
					<NavigationItem
						item="item-2"
						title="Item 2"
						href="https://example.com/item-2"
						onClick={ onMockLinkClick }
					/>
					<NavigationItem
						item="item-sub-menu"
						navigateToMenu="sub-menu"
						title="Sub-Menu"
					/>
				</NavigationMenu>
				<NavigationMenu
					menu="sub-menu"
					parentMenu="root"
					title="Sub-Menu"
				>
					<NavigationItem
						item="child-1"
						onClick={ () => setActiveItem( 'child-1' ) }
						title="Child 1"
					/>
					<NavigationItem
						item="child-2"
						onClick={ () => setActiveItem( 'child-2' ) }
						title="Child 2"
					/>
					<NavigationItem
						item="child-nested-sub-menu"
						navigateToMenu="nested-sub-menu"
						title="Nested Sub-Menu"
					/>
				</NavigationMenu>
				<NavigationMenu
					menu="nested-sub-menu"
					parentMenu="sub-menu"
					title="Nested Sub-Menu"
				>
					<NavigationItem
						item="sub-child-1"
						onClick={ () => setActiveItem( 'sub-child-1' ) }
						title="Sub-Child 1"
					/>
					<NavigationItem
						item="sub-child-2"
						onClick={ () => setActiveItem( 'sub-child-2' ) }
						title="Sub-Child 2"
					/>
				</NavigationMenu>
			</Navigation>

			<div className="navigation-story__aside">
				<p>
					Menu <code>{ activeMenu }</code> is active.
					<br />
					Item <code>{ activeItem }</code> is active.
				</p>
				<p>
					<button
						onClick={ () => {
							setActiveMenu( 'nested-sub-menu' );
						} }
					>
						Open the Nested Sub-Menu menu
					</button>
				</p>
				<p>
					<button
						onClick={ () => {
							setActiveItem( 'child-2' );
							setActiveMenu( 'sub-menu' );
						} }
					>
						Navigate to Child 2 item
					</button>
				</p>
			</div>
		</>
	);
};

describe( 'Navigation', () => {
	it( 'should render the panes and active item', async () => {
		render( <TestNavigation activeItem="item-2" /> );

		const menuItems = screen.getAllByRole( 'listitem' );

		expect( menuItems ).toHaveLength( 4 );
		expect( menuItems[ 0 ] ).toHaveTextContent( 'Item 1' );
		expect( menuItems[ 1 ] ).toHaveTextContent( 'Item 2' );
		expect( menuItems[ 2 ] ).toHaveTextContent( 'Category' );
		expect( menuItems[ 3 ] ).toHaveTextContent( 'customize me' );

		expect(
			screen.getByRole( 'link', { current: 'page' } )
		).toHaveTextContent( 'Item 2' );
	} );

	it( 'should render anchor links when menu item supplies an href', () => {
		render( <TestNavigation /> );

		const linkItem = screen.getByRole( 'link', { name: 'Item 2' } );

		expect( linkItem ).toBeInTheDocument();
		expect( linkItem ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'should render a custom component when menu item supplies one', () => {
		render( <TestNavigation /> );

		expect( screen.getByText( 'customize me' ) ).toBeInTheDocument();
	} );

	it( 'should set an active category on click', async () => {
		const user = userEvent.setup();

		render( <TestNavigation /> );

		await user.click( screen.getByRole( 'button', { name: 'Category' } ) );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Category' );
		const menuItems = screen.getAllByRole( 'listitem' );
		expect( menuItems ).toHaveLength( 2 );
		expect( menuItems[ 0 ] ).toHaveTextContent( 'Child 1' );
		expect( menuItems[ 1 ] ).toHaveTextContent( 'Child 2' );
	} );

	it( 'should render the root title', () => {
		const { rerender } = render( <TestNavigation /> );

		expect( screen.queryByRole( 'heading' ) ).not.toBeInTheDocument();

		rerender( <TestNavigation rootTitle="Home" /> );

		expect( screen.getByRole( 'heading' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Home' );
	} );

	it( 'should render badges', () => {
		render( <TestNavigation showBadge /> );

		const menuItem = screen.getAllByRole( 'listitem' );
		expect( menuItem[ 0 ] ).toHaveTextContent( 'Item 1' + '21' );
	} );

	it( 'should render menu titles when items exist', () => {
		const { rerender } = render( <Navigation></Navigation> );

		expect( screen.queryByText( 'Menu title' ) ).not.toBeInTheDocument();

		rerender( <TestNavigation rootTitle="Menu title" /> );

		expect( screen.getByText( 'Menu title' ) ).toBeInTheDocument();
	} );

	it( 'should navigate up a level when clicking the back button', async () => {
		const user = userEvent.setup();

		render( <TestNavigation rootTitle="Home" /> );

		await user.click( screen.getByRole( 'button', { name: 'Category' } ) );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Category' );

		await user.click( screen.getByRole( 'button', { name: 'Home' } ) );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Home' );
	} );

	it( 'should navigate correctly when controlled', async () => {
		const user = userEvent.setup();

		render( <TestNavigationControlled /> );

		// check root menu is shown and item 1 is selected
		expect(
			screen.getByRole( 'heading', { name: 'Home' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { current: 'page' } )
		).toHaveTextContent( 'Item 1' );

		// click Item 2, check it's selected
		await user.click( screen.getByRole( 'link', { name: 'Item 2' } ) );
		expect(
			screen.getByRole( 'link', { current: 'page' } )
		).toHaveTextContent( 'Item 2' );

		// click sub-menu, check new menu is shown
		await user.click( screen.getByRole( 'button', { name: 'Sub-Menu' } ) );
		expect(
			screen.getByRole( 'heading', { name: 'Sub-Menu' } )
		).toBeInTheDocument();

		// click Child 1, check it's selected
		await user.click( screen.getByRole( 'button', { name: 'Child 1' } ) );
		expect(
			screen.getByRole( 'button', { current: 'page' } )
		).toHaveTextContent( 'Child 1' );

		// click nested sub-menu, check nested sub-menu is shown
		await user.click(
			screen.getByRole( 'button', { name: 'Nested Sub-Menu' } )
		);
		expect(
			screen.getByRole( 'heading', { name: 'Nested Sub-Menu' } )
		).toBeInTheDocument();

		// click Sub Child 2, check it's selected
		await user.click(
			screen.getByRole( 'button', { name: 'Sub-Child 2' } )
		);
		expect(
			screen.getByRole( 'button', { current: 'page' } )
		).toHaveTextContent( 'Sub-Child 2' );

		// click back, check sub-menu is shown
		await user.click( screen.getByRole( 'button', { name: 'Sub-Menu' } ) );
		expect(
			screen.getByRole( 'heading', { name: 'Sub-Menu' } )
		).toBeInTheDocument();

		// click back, check root menu is shown
		await user.click( screen.getByRole( 'button', { name: 'Home' } ) );
		expect(
			screen.getByRole( 'heading', { name: 'Home' } )
		).toBeInTheDocument();

		// click the programmatic nested sub-menu button, check nested sub menu is shown
		await user.click(
			screen.getByRole( 'button', {
				name: 'Open the Nested Sub-Menu menu',
			} )
		);
		expect(
			screen.getByRole( 'heading', { name: 'Nested Sub-Menu' } )
		).toBeInTheDocument();

		// click navigate to child2 item button, check the correct menu is shown and the item is selected
		await user.click(
			screen.getByRole( 'button', {
				name: 'Navigate to Child 2 item',
			} )
		);
		expect(
			screen.getByRole( 'heading', { name: 'Sub-Menu' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { current: 'page' } )
		).toHaveTextContent( 'Child 2' );
	} );
} );
