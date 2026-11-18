import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

// Needs to be kept in sync with the query in `page-list/edit.jsx`, so the
// Auto menu reads the same cached records the Page List renders.
const MAX_PAGE_COUNT = 100;
const PAGES_QUERY = {
	per_page: MAX_PAGE_COUNT,
	_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
	orderby: 'menu_order',
	order: 'asc',
};

/**
 * A page record, with the fields in `PAGES_QUERY`.
 */
export interface AutoMenuPageRecord {
	id: number;
	link: string;
	menu_order: number;
	parent: number;
	title?: { rendered?: string };
	type: string;
}

/**
 * A page in an Auto menu, nested under its parent page.
 */
export interface AutoMenuPage {
	id: number;
	title: string;
	children: AutoMenuPage[];
}

/**
 * The Page List that makes a menu an Auto menu, if the Navigation block's
 * only inner block is one.
 *
 * @param navigationClientId Client id of the Navigation block.
 * @return The Page List block.
 */
export function useAutoMenuPageList(
	navigationClientId: string | null | undefined
): { clientId: string; attributes: Record< string, any > } | null {
	return useSelect(
		( select ) => {
			if ( ! navigationClientId ) {
				return null;
			}
			const { getBlockOrder, getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			const order = getBlockOrder( navigationClientId );
			if (
				order.length !== 1 ||
				getBlockName( order[ 0 ] ) !== 'core/page-list'
			) {
				return null;
			}
			return {
				clientId: order[ 0 ],
				attributes: getBlockAttributes( order[ 0 ] ) as Record<
					string,
					any
				>,
			};
		},
		[ navigationClientId ]
	);
}

function getTitle( page: AutoMenuPageRecord ) {
	const title = page.title?.rendered?.trim();
	// translators: displayed when a page has an empty title.
	return title ? title : __( '(no title)' );
}

/**
 * The pages an Auto menu shows, the same way the Page List renders them:
 * sorted by page order then title, nested by parent, starting from the
 * Page List's parent page.
 *
 * @param parentPageID The Page List's `parentPageID` attribute.
 * @return The pages.
 */
export function useAutoMenuPages( parentPageID: number | null = 0 ): {
	pages: AutoMenuPageRecord[] | null;
	tree: AutoMenuPage[];
	hasResolved: boolean;
} {
	const { records: pages, hasResolved } =
		useEntityRecords< AutoMenuPageRecord >(
			'postType',
			'page',
			PAGES_QUERY
		);

	const tree = useMemo( (): AutoMenuPage[] => {
		if ( ! pages ) {
			return [];
		}
		const sorted = [ ...pages ].sort( ( a, b ) => {
			if ( a.menu_order === b.menu_order ) {
				return getTitle( a ).localeCompare( getTitle( b ) );
			}
			return a.menu_order - b.menu_order;
		} );
		const byParent = new Map< number, AutoMenuPageRecord[] >();
		sorted.forEach( ( page ) => {
			if ( ! byParent.has( page.parent ) ) {
				byParent.set( page.parent, [] );
			}
			byParent.get( page.parent )!.push( page );
		} );
		const build = ( parentId: number ): AutoMenuPage[] =>
			( byParent.get( parentId ) ?? [] ).map( ( page ) => ( {
				id: page.id,
				title: getTitle( page ),
				children: build( page.id ),
			} ) );
		return build( parentPageID ?? 0 );
	}, [ pages, parentPageID ] );

	return { pages, tree, hasResolved };
}
