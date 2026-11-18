import { describe, expect, it } from 'vitest';
import {
	getPagesByParentId,
	getHiddenPageIds,
	getMissingPageIds,
	getNonPageBlocks,
	getPageIds,
	getPageTreeEdits,
} from '../utils';
import type { PageListTreeBlock } from '../utils';

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

const item = (
	id: number,
	innerBlocks: PageListTreeBlock[] = [],
	isHidden = false
): PageListTreeBlock => ( {
	clientId: `page-${ id }`,
	name: 'core/page-list-item',
	attributes: {
		id,
		...( isHidden && { metadata: { blockVisibility: false } } ),
	},
	innerBlocks,
} );

const link = ( clientId: string ): PageListTreeBlock => ( {
	clientId,
	name: 'core/navigation-link',
	attributes: {},
	innerBlocks: [],
} );

// The tree as the pages are now.
const tree = () => [
	item( 1, [ item( 3 ), item( 2 ) ] ),
	item( 4 ),
	item( 5 ),
];

describe( 'getPageTreeEdits', () => {
	const byParent = getPagesByParentId( PAGES );

	it( 'returns no edits when nothing moved', () => {
		expect( getPageTreeEdits( byParent, 0, tree() ) ).toEqual( [] );
	} );

	it( 'numbers a level whose order changed, editing the pages that need it', () => {
		const moved = [
			item( 5 ),
			item( 1, [ item( 3 ), item( 2 ) ] ),
			item( 4 ),
		];
		// About (1) and Shop (2) already have the menu order of their place.
		expect( getPageTreeEdits( byParent, 0, moved ) ).toEqual( [
			{ id: 5, menu_order: 0 },
		] );
	} );

	it( 'numbers pages that shared a menu order in the order shown', () => {
		const moved = [
			item( 1, [ item( 2 ), item( 3 ) ] ),
			item( 4 ),
			item( 5 ),
		];
		expect( getPageTreeEdits( byParent, 0, moved ) ).toEqual( [
			{ id: 3, menu_order: 1 },
		] );
	} );

	it( 'gives a page moved to another level its new parent', () => {
		const moved = [
			item( 1, [ item( 3 ), item( 2 ), item( 5 ) ] ),
			item( 4 ),
		];
		expect( getPageTreeEdits( byParent, 0, moved ) ).toEqual( [
			{ id: 1, menu_order: 0 },
			{ id: 4, menu_order: 1 },
			{ id: 2, menu_order: 1 },
			{ id: 5, menu_order: 2, parent: 1 },
		] );
	} );
} );

describe( 'getMissingPageIds', () => {
	const byParent = getPagesByParentId( PAGES );

	it( 'lists the pages that are not in the tree', () => {
		expect(
			getMissingPageIds( byParent, 0, [
				item( 1, [ item( 3 ) ] ),
				item( 5 ),
			] )
		).toEqual( [ 2, 4 ] );
	} );

	it( 'finds pages moved to another level', () => {
		expect(
			getMissingPageIds( byParent, 0, [
				item( 1, [ item( 3 ), item( 2 ), item( 4 ) ] ),
				item( 5 ),
			] )
		).toEqual( [] );
	} );
} );

describe( 'getNonPageBlocks', () => {
	it( 'lists the items among the pages, at any level', () => {
		expect(
			getNonPageBlocks( [
				item( 1, [ item( 3 ), link( 'a' ) ] ),
				link( 'b' ),
				item( 4 ),
			] ).map( ( { clientId } ) => clientId )
		).toEqual( [ 'a', 'b' ] );
	} );
} );

describe( 'getHiddenPageIds', () => {
	it( 'lists the hidden pages, at any level', () => {
		expect(
			getHiddenPageIds( [
				item( 1, [ item( 3, [], true ) ], true ),
				item( 4 ),
			] )
		).toEqual( [ 1, 3 ] );
	} );
} );

describe( 'getPageIds', () => {
	it( 'lists the pages in tree order', () => {
		expect( getPageIds( tree() ) ).toEqual( [ 1, 3, 2, 4, 5 ] );
	} );
} );
