/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

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
		const { container } = render(
			<Navigation activeItemId={ 'item-2' } data={ sampleData }>
				{ renderPane() }
			</Navigation>
		);

		const menuItems = container.querySelectorAll(
			'.components-navigation__menu-item'
		);

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
		const { container, getByText } = render(
			<Navigation data={ sampleData }>{ renderPane() }</Navigation>
		);

		fireEvent.click( getByText( 'Category' ) );
		const categoryTitle = container.querySelector( 'h2' );
		const menuItems = container.querySelectorAll(
			'.components-navigation__menu-item'
		);
		expect( categoryTitle.textContent ).toBe( 'Category' );
		expect( menuItems.length ).toBe( 2 );
		expect( menuItems[ 0 ].textContent ).toBe( 'Child 1' );
		expect( menuItems[ 1 ].textContent ).toBe( 'Child 2' );
	} );

	it( 'should render the root title', async () => {
		const { container, rerender } = render(
			<Navigation data={ sampleData }>{ renderPane() }</Navigation>
		);

		const emptyTitle = container.querySelector( 'h2' );
		expect( emptyTitle.textContent ).toBe( '' );

		rerender(
			<Navigation rootTitle="Home" data={ sampleData }>
				{ renderPane() }
			</Navigation>
		);

		const rootTitle = container.querySelector( 'h2' );
		expect( rootTitle.textContent ).toBe( 'Home' );
	} );

	it( 'should render badges', async () => {
		const { container } = render(
			<Navigation
				data={ [ { id: 'item-1', title: 'Item 1', badge: 21 } ] }
			>
				{ renderPane() }
			</Navigation>
		);

		const menuItem = container.querySelector(
			'.components-navigation__menu-item'
		);
		expect( menuItem.textContent ).toBe( 'Item 1' + '21' );
	} );

	it( 'should navigate up a level when clicking the back button', async () => {
		const { container, getByText } = render(
			<Navigation data={ sampleData } rootTitle="Home">
				{ renderPane() }
			</Navigation>
		);

		fireEvent.click( getByText( 'Category' ) );
		let levelTitle = container.querySelector( 'h2' );
		expect( levelTitle.textContent ).toBe( 'Category' );
		fireEvent.click( getByText( 'Back' ) );
		levelTitle = container.querySelector( 'h2' );
		expect( levelTitle.textContent ).toBe( 'Home' );
	} );
} );
