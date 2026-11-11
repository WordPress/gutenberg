import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PagesList, { PageDragChip } from '../pages-list';
import { getPagesByParentId, getPageRows } from '../utils';

const page = ( id: number, title: string, parent = 0, menuOrder = 0 ) => ( {
	id,
	parent,
	menu_order: menuOrder,
	title: { rendered: title },
} );

const PAGES = [
	page( 1, 'About', 0, 0 ),
	page( 2, 'Team', 1, 0 ),
	page( 3, 'Shop', 0, 1 ),
];

function renderPanel( {
	excludedIds = [] as number[],
	canReorder = true,
	canAddLinks = false,
	isDraggingItems = false,
}: {
	excludedIds?: number[];
	canReorder?: boolean;
	canAddLinks?: boolean;
	isDraggingItems?: boolean;
} = {} ) {
	const onToggle = vi.fn();
	const onMove = vi.fn();
	const onAddLinkAfter = vi.fn();
	const onDropItems = vi.fn();
	const rows = getPageRows(
		getPagesByParentId( PAGES ),
		0,
		new Set( excludedIds )
	);
	render(
		<PagesList
			rows={ rows }
			excludedIds={ excludedIds }
			canReorder={ canReorder }
			onToggle={ onToggle }
			onMove={ onMove }
			onAddLinkAfter={ canAddLinks ? onAddLinkAfter : null }
			canDropItems={ () => isDraggingItems }
			onDropItems={ onDropItems }
		/>
	);
	return { onToggle, onMove, onAddLinkAfter, onDropItems };
}

describe( 'PagesList', () => {
	it( 'shows a switch for every page, on unless hidden', () => {
		renderPanel( { excludedIds: [ 3 ] } );

		expect(
			screen.getByRole( 'switch', { name: 'Show About in the menu' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'switch', { name: 'Show Shop in the menu' } )
		).not.toBeChecked();
	} );

	it( 'turns off and disables the switches of a hidden page’s children', () => {
		renderPanel( { excludedIds: [ 1 ] } );

		const team = screen.getByRole( 'switch', {
			name: 'Show Team in the menu',
		} );
		expect( team ).not.toBeChecked();
		// The switch is a `span`, so it's disabled through ARIA.
		expect( team ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'toggles a page', () => {
		const { onToggle } = renderPanel();

		fireEvent.click(
			screen.getByRole( 'switch', { name: 'Show Shop in the menu' } )
		);
		expect( onToggle ).toHaveBeenCalledWith( 3 );
	} );

	it( 'moves a page among its siblings with the arrow keys', () => {
		const { onMove } = renderPanel();

		const shopHandle = screen.getByRole( 'button', {
			name: 'Reorder Shop',
		} );
		fireEvent.keyDown( shopHandle, { key: 'ArrowUp' } );
		expect( onMove ).toHaveBeenCalledWith(
			expect.objectContaining( { page: PAGES[ 2 ] } ),
			0,
			0
		);

		// Shop is last, and Team is its parent's only child.
		onMove.mockClear();
		fireEvent.keyDown( shopHandle, { key: 'ArrowDown' } );
		fireEvent.keyDown(
			screen.getByRole( 'button', { name: 'Reorder Team' } ),
			{ key: 'ArrowUp' }
		);
		expect( onMove ).not.toHaveBeenCalled();
	} );

	it( 'leaves out the reorder controls for people who can’t edit pages', () => {
		renderPanel( { canReorder: false } );

		expect(
			screen.queryByRole( 'button', { name: 'Reorder Shop' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'switch', { name: 'Show Shop in the menu' } )
		).toBeInTheDocument();
	} );

	it( 'adds a link after a page from its options', async () => {
		const { onAddLinkAfter } = renderPanel( { canAddLinks: true } );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Options for Shop' } )
		);
		fireEvent.click(
			await screen.findByRole( 'menuitem', { name: /Add link after/ } )
		);
		expect( onAddLinkAfter ).toHaveBeenCalledWith(
			expect.objectContaining( { page: PAGES[ 2 ] } )
		);
	} );

	it( 'doesn’t add a link after a hidden page', async () => {
		renderPanel( { canAddLinks: true, excludedIds: [ 3 ] } );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Options for Shop' } )
		);
		expect(
			await screen.findByRole( 'menuitem', { name: /Add link after/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'shows the page being dragged in its drag chip', () => {
		render( <PageDragChip title="Catering" /> );
		expect( screen.getByText( 'Catering' ) ).toBeInTheDocument();
	} );

	it( 'takes another menu item dropped next to a page', () => {
		const { onDropItems } = renderPanel( { isDraggingItems: true } );
		const shop = screen
			.getAllByRole( 'listitem' )
			.find( ( item ) => within( item ).queryByText( 'Shop' ) )!;

		fireEvent.dragOver( shop, {
			clientY: 0,
			dataTransfer: { dropEffect: 'none' },
		} );
		fireEvent.drop( shop );
		expect( onDropItems ).toHaveBeenCalledWith(
			expect.objectContaining( { page: PAGES[ 2 ] } ),
			false
		);
	} );

	it( 'doesn’t take a menu item next to a hidden page', () => {
		const { onDropItems } = renderPanel( {
			isDraggingItems: true,
			excludedIds: [ 3 ],
		} );
		const shop = screen
			.getAllByRole( 'listitem' )
			.find( ( item ) => within( item ).queryByText( 'Shop' ) )!;

		fireEvent.dragOver( shop, {
			clientY: 0,
			dataTransfer: { dropEffect: 'none' },
		} );
		fireEvent.drop( shop );
		expect( onDropItems ).not.toHaveBeenCalled();
	} );

	it( 'moves a child page out of its parent from its options', async () => {
		const { onMove } = renderPanel();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Options for Team' } )
		);
		fireEvent.click(
			await screen.findByRole( 'menuitem', { name: 'Move out of About' } )
		);
		// About is first at the top level, so Team goes straight after it.
		expect( onMove ).toHaveBeenCalledWith(
			expect.objectContaining( { page: PAGES[ 1 ] } ),
			0,
			1
		);
	} );

	it( 'moves a page under the page before it from its options', async () => {
		const { onMove } = renderPanel();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Options for Shop' } )
		);
		fireEvent.click(
			await screen.findByRole( 'menuitem', { name: 'Move under About' } )
		);
		// About has one child page, Team, so Shop goes after it.
		expect( onMove ).toHaveBeenCalledWith(
			expect.objectContaining( { page: PAGES[ 2 ] } ),
			1,
			1
		);
	} );

	it( 'offers neither for a top-level page that comes first', async () => {
		renderPanel();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Options for About' } )
		);
		await screen.findByRole( 'menuitem', { name: 'Move down' } );
		expect(
			screen.queryByRole( 'menuitem', { name: /Move out of|Move under/ } )
		).not.toBeInTheDocument();
	} );
} );
