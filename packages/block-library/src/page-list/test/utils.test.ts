import { describe, expect, it } from 'vitest';
import {
	getPagesByParentId,
	getPageRows,
	getMenuOrderEdits,
	getVisiblePages,
} from '../utils';

const page = ( id: number, title: string, parent = 0, menuOrder = 0 ) => ( {
	id,
	parent,
	menu_order: menuOrder,
	title: { rendered: title },
} );

// About (with Team and History), Shop, Contact.
const PAGES = [
	page( 5, 'Contact', 0, 3 ),
	page( 2, 'Team', 1, 0 ),
	page( 1, 'About', 0, 1 ),
	page( 3, 'History', 1, 0 ),
	page( 4, 'Shop', 0, 2 ),
];

describe( 'getPagesByParentId', () => {
	it( 'groups pages by parent, sorted by menu order then title', () => {
		const byParent = getPagesByParentId( PAGES );

		expect( byParent.get( 0 )?.map( ( { id } ) => id ) ).toEqual( [
			1, 4, 5,
		] );
		// Equal menu orders fall back to the title.
		expect( byParent.get( 1 )?.map( ( { id } ) => id ) ).toEqual( [
			3, 2,
		] );
	} );

	it( 'does not sort the pages it is given in place', () => {
		const pages = [ ...PAGES ];
		getPagesByParentId( pages );
		expect( pages ).toEqual( PAGES );
	} );

	it( 'returns an empty map when there are no pages', () => {
		expect( getPagesByParentId( null ).size ).toBe( 0 );
	} );
} );

describe( 'getPageRows', () => {
	const byParent = getPagesByParentId( PAGES );

	it( 'lists child pages straight after their parent', () => {
		const rows = getPageRows( byParent, 0, new Set() );

		expect(
			rows.map( ( { page: { id }, depth } ) => [ id, depth ] )
		).toEqual( [
			[ 1, 0 ],
			[ 3, 1 ],
			[ 2, 1 ],
			[ 4, 0 ],
			[ 5, 0 ],
		] );
		expect( rows[ 1 ] ).toMatchObject( { index: 0, siblingIds: [ 3, 2 ] } );
	} );

	it( 'marks the child pages of a hidden page', () => {
		const rows = getPageRows( byParent, 0, new Set( [ 1 ] ) );

		expect(
			rows.map( ( { page: { id }, isHiddenByAncestor } ) => [
				id,
				isHiddenByAncestor,
			] )
		).toEqual( [
			[ 1, false ],
			[ 3, true ],
			[ 2, true ],
			[ 4, false ],
			[ 5, false ],
		] );
	} );

	it( 'starts from the parent page', () => {
		const rows = getPageRows( byParent, 1, new Set() );
		expect( rows.map( ( { page: { id } } ) => id ) ).toEqual( [ 3, 2 ] );
	} );
} );

describe( 'getVisiblePages', () => {
	it( 'leaves out hidden pages and their child pages', () => {
		const byParent = getPagesByParentId( PAGES );
		const visible = getVisiblePages( byParent, new Set( [ 1, 5 ] ) );
		expect( visible.map( ( { id } ) => id ) ).toEqual( [ 4 ] );
	} );

	it( 'lists parents before their child pages, in order', () => {
		const byParent = getPagesByParentId( PAGES );
		const visible = getVisiblePages( byParent, new Set() );
		expect( visible.map( ( { id } ) => id ) ).toEqual( [ 1, 3, 2, 4, 5 ] );
	} );
} );

describe( 'getMenuOrderEdits', () => {
	const siblings = [
		page( 1, 'About', 0, 0 ),
		page( 4, 'Shop', 0, 1 ),
		page( 5, 'Contact', 0, 2 ),
	];

	it( 'renumbers the siblings in their new order', () => {
		expect( getMenuOrderEdits( siblings, 5, 0 ) ).toEqual( [
			{ id: 5, menu_order: 0 },
			{ id: 1, menu_order: 1 },
			{ id: 4, menu_order: 2 },
		] );
	} );

	it( 'only edits pages whose order changes', () => {
		expect( getMenuOrderEdits( siblings, 4, 2 ) ).toEqual( [
			{ id: 5, menu_order: 1 },
			{ id: 4, menu_order: 2 },
		] );
	} );

	it( 'numbers pages that shared a menu order', () => {
		const unordered = [
			page( 1, 'About' ),
			page( 4, 'Shop' ),
			page( 5, 'Contact' ),
		];
		// Shop already has the order 0 that its new place gets.
		expect( getMenuOrderEdits( unordered, 1, 1 ) ).toEqual( [
			{ id: 1, menu_order: 1 },
			{ id: 5, menu_order: 2 },
		] );
	} );

	it( 'returns no edits for a move that changes nothing', () => {
		expect( getMenuOrderEdits( siblings, 1, 0 ) ).toEqual( [] );
		expect( getMenuOrderEdits( siblings, 1, -1 ) ).toEqual( [] );
		expect( getMenuOrderEdits( siblings, 1, 3 ) ).toEqual( [] );
		expect( getMenuOrderEdits( siblings, 99, 0 ) ).toEqual( [] );
	} );
} );
