/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Navigation from '../';
import NavigationMenu from '../menu';
import NavigationMenuItem from '../menu-item';

const sampleData = [
	{
		title: 'Item 1',
		id: 'item-1',
	},
	{
		title: 'Item 2',
		id: 'item-2',
	},
	{
		title: 'Category',
		id: 'category',
	},
	{
		title: 'Child 1',
		id: 'child-1',
		parent: 'category',
	},
	{
		title: 'Child 2',
		id: 'child-2',
		parent: 'category',
	},
];

const renderPane = () => ( { level, NavigationBackButton } ) => {
	return (
		<>
			<h2>{ level.title }</h2>
			<NavigationBackButton>Back</NavigationBackButton>
			<NavigationMenu>
				{ level.children.map( ( item ) => {
					return <NavigationMenuItem { ...item } key={ item.id } />;
				} ) }
			</NavigationMenu>
		</>
	);
};

describe( 'Navigation', () => {
	it( 'should render the panes and active item', async () => {
		render(
			<Navigation activeItemId={ 'item-2' } data={ sampleData }>
				{ renderPane() }
			</Navigation>
		);

		const menuItems = screen.getAllByRole( 'listitem' );

		expect( menuItems.length ).toBe( 3 );
		expect( menuItems[ 0 ].textContent ).toBe( 'Item 1' );
		expect( menuItems[ 1 ].textContent ).toBe( 'Item 2' );
		expect( menuItems[ 2 ].textContent ).toBe( 'Category' );
		expect( menuItems[ 0 ].classList.contains( 'is-active' ) ).toBe(
			false
		);
		expect( menuItems[ 1 ].classList.contains( 'is-active' ) ).toBe( true );
	} );

	it( 'should set an active category on click', async () => {
		render( <Navigation data={ sampleData }>{ renderPane() }</Navigation> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Category' } ) );
		const categoryTitle = screen.getByRole( 'heading' );
		const menuItems = screen.getAllByRole( 'listitem' );

		expect( categoryTitle.textContent ).toBe( 'Category' );
		expect( menuItems.length ).toBe( 2 );
		expect( menuItems[ 0 ].textContent ).toBe( 'Child 1' );
		expect( menuItems[ 1 ].textContent ).toBe( 'Child 2' );
	} );

	it( 'should render the root title', async () => {
		const { rerender } = render(
			<Navigation data={ sampleData }>{ renderPane() }</Navigation>
		);

		const emptyTitle = screen.getByRole( 'heading' );
		expect( emptyTitle.textContent ).toBe( '' );

		rerender(
			<Navigation rootTitle="Home" data={ sampleData }>
				{ renderPane() }
			</Navigation>
		);

		const rootTitle = screen.getByRole( 'heading' );
		expect( rootTitle.textContent ).toBe( 'Home' );
	} );

	it( 'should render badges', async () => {
		render(
			<Navigation
				data={ [ { id: 'item-1', title: 'Item 1', badge: 21 } ] }
			>
				{ renderPane() }
			</Navigation>
		);

		const menuItem = screen.getByRole( 'listitem' );
		expect( menuItem.textContent ).toBe( 'Item 1' + '21' );
	} );

	it( 'should navigate up a level when clicking the back button', async () => {
		render(
			<Navigation data={ sampleData } rootTitle="Home">
				{ renderPane() }
			</Navigation>
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'Category' } ) );
		let levelTitle = screen.getByRole( 'heading' );
		expect( levelTitle.textContent ).toBe( 'Category' );
		fireEvent.click( screen.getByRole( 'button', { name: 'Back' } ) );
		levelTitle = screen.getByRole( 'heading' );
		expect( levelTitle.textContent ).toBe( 'Home' );
	} );
} );
