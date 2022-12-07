/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

// copied from packages/block-library/src/page-list/edit.js

export default () => {
	// 1. Grab editor settings
	// 2. Call the selector when we need it
	const { pages } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );

		return {
			pages: getSettings().__experimentalFetchPageEntities( {
				orderby: 'menu_order',
				order: 'asc',
				_fields: [ 'id', 'link', 'parent', 'title', 'menu_order' ],
				per_page: -1,
				context: 'view',
			} ),
		};
	}, [] );

	return useMemo( () => {
		// TODO: Once the REST API supports passing multiple values to
		// 'orderby', this can be removed.
		// https://core.trac.wordpress.org/ticket/39037
		const sortedPages = [ ...( pages ?? [] ) ].sort( ( a, b ) => {
			if ( a.menu_order === b.menu_order ) {
				return a.title.rendered.localeCompare( b.title.rendered );
			}
			return a.menu_order - b.menu_order;
		} );
		const pagesByParentId = sortedPages.reduce( ( accumulator, page ) => {
			const { parent } = page;
			if ( accumulator.has( parent ) ) {
				accumulator.get( parent ).push( page );
			} else {
				accumulator.set( parent, [ page ] );
			}
			return accumulator;
		}, new Map() );

		return {
			pages, // necessary for access outside the hook
			pagesByParentId,
			totalPages: pages?.length ?? null,
		};
	}, [ pages ] );
};
