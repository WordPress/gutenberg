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
 * The Page List that makes a menu an Auto menu, if the Navigation block's
 * only inner block is one.
 *
 * @param {?string} navigationClientId Client id of the Navigation block.
 * @return {{clientId: string, attributes: Object}|null} The Page List block.
 */
export function useAutoMenuPageList( navigationClientId ) {
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
				attributes: getBlockAttributes( order[ 0 ] ),
			};
		},
		[ navigationClientId ]
	);
}

function getTitle( page ) {
	const title = page.title?.rendered?.trim();
	// translators: displayed when a page has an empty title.
	return title ? title : __( '(no title)' );
}

/**
 * The pages an Auto menu shows, the same way the Page List renders them:
 * sorted by page order then title, nested by parent, starting from the
 * Page List's parent page.
 *
 * @param {number} parentPageID The Page List's `parentPageID` attribute.
 * @return {{pages: ?Array, tree: Array, hasResolved: boolean}} The pages.
 */
export function useAutoMenuPages( parentPageID = 0 ) {
	const { records: pages, hasResolved } = useEntityRecords(
		'postType',
		'page',
		PAGES_QUERY
	);

	const tree = useMemo( () => {
		if ( ! pages ) {
			return [];
		}
		const sorted = [ ...pages ].sort( ( a, b ) => {
			if ( a.menu_order === b.menu_order ) {
				return getTitle( a ).localeCompare( getTitle( b ) );
			}
			return a.menu_order - b.menu_order;
		} );
		const byParent = new Map();
		sorted.forEach( ( page ) => {
			if ( ! byParent.has( page.parent ) ) {
				byParent.set( page.parent, [] );
			}
			byParent.get( page.parent ).push( page );
		} );
		const build = ( parentId ) =>
			( byParent.get( parentId ) ?? [] ).map( ( page ) => ( {
				id: page.id,
				title: getTitle( page ),
				children: build( page.id ),
			} ) );
		return build( parentPageID ?? 0 );
	}, [ pages, parentPageID ] );

	return { pages, tree, hasResolved };
}
