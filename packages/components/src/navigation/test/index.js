/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationItem from '../item';
import NavigationMenu from '../menu';

const TestNavigation = ( { activeItem, rootTitle, showBadge } = {} ) => (
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
		render( <TestNavigation activeItem="item-2" /> );

		const menuItems = screen.getAllByRole( 'listitem' );

		expect( menuItems ).toHaveLength( 4 );
		expect( menuItems[ 0 ] ).toHaveTextContent( 'Item 1' );
		expect( menuItems[ 1 ] ).toHaveTextContent( 'Item 2' );
		expect( menuItems[ 2 ] ).toHaveTextContent( 'Category' );
		expect( menuItems[ 3 ] ).toHaveTextContent( 'customize me' );
		expect( menuItems[ 0 ] ).not.toHaveClass( 'is-active' );
		expect( menuItems[ 1 ] ).toHaveClass( 'is-active' );
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
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

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
		expect( menuItem[ 0 ].textContent ).toBe( 'Item 1' + '21' );
	} );

	it( 'should render menu titles when items exist', () => {
		const { rerender } = render( <Navigation></Navigation> );

		expect( screen.queryByText( 'Menu title' ) ).not.toBeInTheDocument();

		rerender( <TestNavigation rootTitle="Menu title" /> );

		expect( screen.getByText( 'Menu title' ) ).toBeInTheDocument();
	} );

	it( 'should navigate up a level when clicking the back button', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		render( <TestNavigation rootTitle="Home" /> );

		await user.click( screen.getByRole( 'button', { name: 'Category' } ) );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Category' );

		await user.click( screen.getByRole( 'button', { name: 'Home' } ) );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Home' );
	} );
} );
