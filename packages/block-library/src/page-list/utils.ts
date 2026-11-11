import { __ } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * The fields of a page record that the Page List block reads.
 */
export interface PageListPage {
	id: number;
	parent: number;
	menu_order: number;
	title?: { rendered?: string };
	link?: string;
	type?: string;
}

/**
 * A page in the Pages panel, in the order the panel lists them.
 */
export interface PageRow {
	page: PageListPage;
	/** How many levels below the list's top the page is. */
	depth: number;
	/** The page's position among its siblings. */
	index: number;
	/** IDs of the page and its siblings, in order. */
	siblingIds: number[];
	/** Whether a hidden ancestor hides the page, whatever its own setting. */
	isHiddenByAncestor: boolean;
}

export interface MenuOrderEdit {
	id: number;
	menu_order: number;
	/** The page's new parent page ID, when it moves to another parent. */
	parent?: number;
}

/**
 * Returns a page's title as plain text, for labels and announcements.
 *
 * @param page Page record.
 * @return The title, or a placeholder when it's empty.
 */
export function getPageTitle( page: PageListPage ): string {
	const title = stripHTML( page.title?.rendered ?? '' ).trim();
	// translators: displayed when a page has an empty title.
	return title !== '' ? title : __( '(no title)' );
}

/**
 * Groups pages by their parent page ID, each group sorted the way the block
 * renders them: by `menu_order`, then by title.
 *
 * TODO: Once the REST API supports passing multiple values to 'orderby', the
 * sort can move to the request. https://core.trac.wordpress.org/ticket/39037
 *
 * @param pages Page records.
 * @return Pages keyed by parent page ID.
 */
export function getPagesByParentId(
	pages: PageListPage[] | null | undefined
): Map< number, PageListPage[] > {
	const pagesByParentId = new Map< number, PageListPage[] >();
	if ( ! pages ) {
		return pagesByParentId;
	}

	const sortedPages = [ ...pages ].sort( ( a, b ) => {
		if ( a.menu_order === b.menu_order ) {
			return ( a.title?.rendered ?? '' ).localeCompare(
				b.title?.rendered ?? ''
			);
		}
		return a.menu_order - b.menu_order;
	} );

	for ( const page of sortedPages ) {
		const siblings = pagesByParentId.get( page.parent );
		if ( siblings ) {
			siblings.push( page );
		} else {
			pagesByParentId.set( page.parent, [ page ] );
		}
	}
	return pagesByParentId;
}

/**
 * Flattens the page tree under a parent into rows for the Pages panel, child
 * pages straight after their parent.
 *
 * @param pagesByParentId Pages keyed by parent page ID.
 * @param parentId        ID of the page to start from.
 * @param excludedIds     IDs of hidden pages.
 * @return The rows.
 */
export function getPageRows(
	pagesByParentId: Map< number, PageListPage[] >,
	parentId: number,
	excludedIds: Set< number >
): PageRow[] {
	const rows: PageRow[] = [];

	function addRows( id: number, depth: number, isHiddenByAncestor: boolean ) {
		const siblings = pagesByParentId.get( id ) ?? [];
		const siblingIds = siblings.map( ( page ) => page.id );

		siblings.forEach( ( page, index ) => {
			rows.push( {
				page,
				depth,
				index,
				siblingIds,
				isHiddenByAncestor,
			} );
			addRows(
				page.id,
				depth + 1,
				isHiddenByAncestor || excludedIds.has( page.id )
			);
		} );
	}

	addRows( parentId, 0, false );
	return rows;
}

/**
 * Lists the pages the block shows, in the order it shows them, parents
 * before their child pages. Hidden pages are left out with their child pages.
 *
 * @param pagesByParentId Pages keyed by parent page ID.
 * @param excludedIds     IDs of hidden pages.
 * @return The visible pages.
 */
export function getVisiblePages(
	pagesByParentId: Map< number, PageListPage[] >,
	excludedIds: Set< number >
): PageListPage[] {
	const visiblePages: PageListPage[] = [];

	function addPages( parentId: number ) {
		for ( const page of pagesByParentId.get( parentId ) ?? [] ) {
			if ( ! excludedIds.has( page.id ) ) {
				visiblePages.push( page );
				addPages( page.id );
			}
		}
	}

	addPages( 0 );
	return visiblePages;
}

/**
 * Works out the `menu_order` edits that move a page among its siblings. The
 * siblings are numbered from zero in their new order, and only pages whose
 * `menu_order` changes get an edit.
 *
 * @param siblings Sibling pages, in their current order.
 * @param pageId   ID of the page to move.
 * @param toIndex  Position to move it to.
 * @return Edits to apply.
 */
export function getMenuOrderEdits(
	siblings: PageListPage[],
	pageId: number,
	toIndex: number
): MenuOrderEdit[] {
	const fromIndex = siblings.findIndex( ( page ) => page.id === pageId );
	if (
		fromIndex === -1 ||
		toIndex < 0 ||
		toIndex >= siblings.length ||
		toIndex === fromIndex
	) {
		return [];
	}

	const reordered = [ ...siblings ];
	const [ moved ] = reordered.splice( fromIndex, 1 );
	reordered.splice( toIndex, 0, moved );

	return reordered.flatMap( ( page, index ) =>
		page.menu_order === index ? [] : [ { id: page.id, menu_order: index } ]
	);
}

/**
 * Whether a page is another page, or one of its descendants.
 *
 * @param pagesByParentId Pages keyed by parent page ID.
 * @param pageId          ID of the page that may be inside the other.
 * @param ancestorId      ID of the other page.
 * @return Whether the page is the other page or inside it.
 */
export function isPageOrDescendant(
	pagesByParentId: Map< number, PageListPage[] >,
	pageId: number,
	ancestorId: number
): boolean {
	if ( pageId === ancestorId ) {
		return true;
	}
	return ( pagesByParentId.get( ancestorId ) ?? [] ).some( ( child ) =>
		isPageOrDescendant( pagesByParentId, pageId, child.id )
	);
}

/**
 * Works out the edits that move a page to a position under a parent, which
 * may be its own parent or another. The pages at its new level are numbered
 * from zero in their new order, only pages whose `menu_order` changes get an
 * edit, and the moved page gets its new `parent` when that changes. A page
 * moves with its child pages, so it can't go under itself or one of them.
 *
 * @param pagesByParentId Pages keyed by parent page ID.
 * @param page            The page to move.
 * @param parentId        ID of the parent to move it under, or 0.
 * @param toIndex         Position among that parent's pages, counted
 *                        without the moved page.
 * @return Edits to apply.
 */
export function getMoveEdits(
	pagesByParentId: Map< number, PageListPage[] >,
	page: PageListPage,
	parentId: number,
	toIndex: number
): MenuOrderEdit[] {
	if ( isPageOrDescendant( pagesByParentId, parentId, page.id ) ) {
		return [];
	}
	if ( parentId === page.parent ) {
		return getMenuOrderEdits(
			pagesByParentId.get( parentId ) ?? [],
			page.id,
			toIndex
		);
	}

	const siblings = ( pagesByParentId.get( parentId ) ?? [] ).filter(
		( { id } ) => id !== page.id
	);
	if ( toIndex < 0 || toIndex > siblings.length ) {
		return [];
	}
	const reordered = [ ...siblings ];
	reordered.splice( toIndex, 0, page );

	return reordered.flatMap( ( sibling, index ) => {
		if ( sibling.id === page.id ) {
			return [ { id: page.id, menu_order: index, parent: parentId } ];
		}
		return sibling.menu_order === index
			? []
			: [ { id: sibling.id, menu_order: index } ];
	} );
}
