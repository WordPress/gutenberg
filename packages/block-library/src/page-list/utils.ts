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
 * A block of a Page List's inner block tree: a page, or an item of the menu
 * around the Page List that was put among its pages.
 */
export interface PageListTreeBlock {
	clientId: string;
	name: string;
	attributes: Record< string, any >;
	innerBlocks: PageListTreeBlock[];
}

export const PAGE_LIST_ITEM = 'core/page-list-item';

/**
 * Returns whether a page's block is hidden, with the standard block
 * visibility setting.
 *
 * @param block Block of a page.
 * @return Whether it's hidden.
 */
export function isPageBlockHidden( block: PageListTreeBlock ): boolean {
	return block.attributes?.metadata?.blockVisibility === false;
}

/**
 * Returns whether a block of a page is anywhere in a tree.
 *
 * @param blocks Blocks of the tree.
 * @param pageId ID of the page.
 * @return Whether the page is in the tree.
 */
function hasPage( blocks: PageListTreeBlock[], pageId: number ): boolean {
	return blocks.some(
		( block ) =>
			( block.name === PAGE_LIST_ITEM &&
				block.attributes.id === pageId ) ||
			hasPage( block.innerBlocks, pageId )
	);
}

/**
 * Lists the blocks in a Page List's tree that aren't pages, such as a link
 * dropped among its pages.
 *
 * @param blocks Blocks of the tree.
 * @return The blocks that aren't pages, not counting their inner blocks.
 */
export function getNonPageBlocks(
	blocks: PageListTreeBlock[]
): PageListTreeBlock[] {
	return blocks.flatMap( ( block ) =>
		block.name === PAGE_LIST_ITEM
			? getNonPageBlocks( block.innerBlocks )
			: [ block ]
	);
}

/**
 * Lists the IDs of the pages in a Page List's tree.
 *
 * @param blocks Blocks of the tree.
 * @return IDs of the pages, in tree order.
 */
export function getPageIds( blocks: PageListTreeBlock[] ): number[] {
	return blocks.flatMap( ( block ) =>
		block.name === PAGE_LIST_ITEM
			? [ block.attributes.id, ...getPageIds( block.innerBlocks ) ]
			: getPageIds( block.innerBlocks )
	);
}

/**
 * Lists the IDs of the pages hidden in a Page List's tree.
 *
 * @param blocks Blocks of the tree.
 * @return IDs of the hidden pages, in tree order.
 */
export function getHiddenPageIds( blocks: PageListTreeBlock[] ): number[] {
	return blocks.flatMap( ( block ) => {
		if ( block.name !== PAGE_LIST_ITEM ) {
			return [];
		}
		const childIds = getHiddenPageIds( block.innerBlocks );
		return isPageBlockHidden( block )
			? [ block.attributes.id, ...childIds ]
			: childIds;
	} );
}

/**
 * Lists the pages under a parent page whose blocks are missing from a Page
 * List's tree: moved out of it, or removed.
 *
 * @param pagesByParentId Pages keyed by parent page ID.
 * @param parentId        ID of the page the Page List starts from.
 * @param blocks          Blocks of the tree.
 * @return IDs of the missing pages.
 */
export function getMissingPageIds(
	pagesByParentId: Map< number, PageListPage[] >,
	parentId: number,
	blocks: PageListTreeBlock[]
): number[] {
	return ( pagesByParentId.get( parentId ) ?? [] ).flatMap( ( page ) =>
		hasPage( blocks, page.id )
			? getMissingPageIds( pagesByParentId, page.id, blocks )
			: [ page.id ]
	);
}

/**
 * Works out the `menu_order` and `parent` edits that give the pages the order
 * and levels they have in a Page List's tree. Each level whose pages changed
 * is numbered from 0, so pages that shared a `menu_order` keep the order
 * shown, and levels that didn't change aren't edited.
 *
 * @param pagesByParentId Pages keyed by parent page ID.
 * @param parentId        ID of the page the tree starts from.
 * @param blocks          Blocks of the tree.
 * @return The edits.
 */
export function getPageTreeEdits(
	pagesByParentId: Map< number, PageListPage[] >,
	parentId: number,
	blocks: PageListTreeBlock[]
): MenuOrderEdit[] {
	const pagesById = new Map< number, PageListPage >();
	for ( const siblings of pagesByParentId.values() ) {
		for ( const page of siblings ) {
			pagesById.set( page.id, page );
		}
	}

	const edits: MenuOrderEdit[] = [];
	function addEdits(
		levelParentId: number,
		levelBlocks: PageListTreeBlock[]
	) {
		const pageBlocks = levelBlocks.filter(
			( block ) =>
				block.name === PAGE_LIST_ITEM &&
				pagesById.has( block.attributes.id )
		);
		const ids = pageBlocks.map( ( block ) => block.attributes.id );
		const savedIds = ( pagesByParentId.get( levelParentId ) ?? [] ).map(
			( page ) => page.id
		);
		const hasChanged =
			ids.length !== savedIds.length ||
			ids.some( ( id, index ) => id !== savedIds[ index ] );
		if ( hasChanged ) {
			ids.forEach( ( id, index ) => {
				const page = pagesById.get( id )!;
				if ( page.parent !== levelParentId ) {
					edits.push( {
						id,
						menu_order: index,
						parent: levelParentId,
					} );
				} else if ( page.menu_order !== index ) {
					edits.push( { id, menu_order: index } );
				}
			} );
		}
		pageBlocks.forEach( ( block ) =>
			addEdits( block.attributes.id, block.innerBlocks )
		);
	}
	addEdits( parentId, blocks );
	return edits;
}
