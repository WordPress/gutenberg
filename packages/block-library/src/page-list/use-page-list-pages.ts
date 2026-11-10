import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { getPagesByParentId } from './utils';
import type { PageListPage } from './utils';

// We only show the detach option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
export const MAX_PAGE_COUNT = 100;

const PAGES_QUERY = {
	per_page: MAX_PAGE_COUNT,
	_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
	// TODO: When https://core.trac.wordpress.org/ticket/39037 REST API support for multiple orderby
	// values is resolved, update 'orderby' to [ 'menu_order', 'post_title' ] to provide a consistent
	// sort.
	orderby: 'menu_order',
	order: 'asc',
};

/**
 * Loads the pages a Page List shows, with any unsaved changes to their order.
 * The Page List block and the Navigation block around it both use it, and as
 * they make the same request, the pages are loaded once.
 *
 * @return The pages, the pages grouped by parent page ID, whether they have
 *         loaded, and whether the user can change their order.
 */
export function usePageListPages(): {
	pages: PageListPage[] | null;
	pagesByParentId: Map< number, PageListPage[] >;
	hasResolvedPages: boolean;
	canReorderPages: boolean;
} {
	const { records: savedPages, hasResolved: hasResolvedPages } =
		useEntityRecords< PageListPage >( 'postType', 'page', PAGES_QUERY );

	// Reordering edits each page's `menu_order`, and those edits stay unsaved
	// until the page entities are saved, so they're merged in here.
	// The map of page IDs to edited orders is returned directly, so `useSelect`
	// compares its values and doesn't re-render while they're unchanged.
	const menuOrderEdits = useSelect(
		( select ) => {
			const { getEntityRecordEdits } = select( coreStore );
			return Object.fromEntries(
				( savedPages ?? [] ).map( ( page ) => [
					page.id,
					(
						getEntityRecordEdits( 'postType', 'page', page.id ) as
							{ menu_order?: number } | undefined
					 )?.menu_order,
				] )
			) as Record< number, number | undefined >;
		},
		[ savedPages ]
	);

	// Asking about the collection only answers whether pages can be created,
	// so this asks about a page. The default roles that can edit one page can
	// edit them all.
	const firstPageId = savedPages?.[ 0 ]?.id;
	const canReorderPages = useSelect(
		( select ) =>
			!! firstPageId &&
			!! select( coreStore ).canUser( 'update', {
				kind: 'postType',
				name: 'page',
				id: firstPageId,
			} ),
		[ firstPageId ]
	);

	const pages = useMemo(
		() =>
			savedPages?.map( ( page ) => {
				const menuOrder = menuOrderEdits[ page.id ];
				return menuOrder === undefined
					? page
					: { ...page, menu_order: menuOrder };
			} ) ?? savedPages,
		[ savedPages, menuOrderEdits ]
	);

	const pagesByParentId = useMemo(
		() => getPagesByParentId( pages ),
		[ pages ]
	);

	return { pages, pagesByParentId, hasResolvedPages, canReorderPages };
}
