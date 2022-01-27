/**
 * WordPress dependencies
 */
import { useQuerySelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * @typedef {Object} NavigationEntitiesData
 * @property {Array|undefined} pages                - a collection of WP Post entity objects of post type "Page".
 * @property {boolean}         isResolvingPages     - indicates whether the request to fetch pages is currently resolving.
 * @property {boolean}         hasResolvedPages     - indicates whether the request to fetch pages has finished resolving.
 * @property {Array|undefined} menus                - a collection of Menu entity objects.
 * @property {boolean}         isResolvingMenus     - indicates whether the request to fetch menus is currently resolving.
 * @property {boolean}         hasResolvedMenus     - indicates whether the request to fetch menus has finished resolving.
 * @property {Array|undefined} menusItems           - a collection of Menu Item entity objects for the current menuId.
 * @property {boolean}         hasResolvedMenuItems - indicates whether the request to fetch menuItems has finished resolving.
 * @property {boolean}         hasPages             - indicates whether there is currently any data for pages.
 * @property {boolean}         hasMenus             - indicates whether there is currently any data for menus.
 */

/**
 * Manages fetching and resolution state for all entities required
 * for the Navigation block.
 *
 * @param {number} menuId the menu for which to retrieve menuItem data.
 * @return { NavigationEntitiesData } the entity data.
 */
export default function useNavigationEntities( menuId ) {
	return {
		...usePageEntities(),
		...useMenuEntities(),
		...useMenuItemEntities( menuId ),
	};
}

function useMenuEntities() {
	const { data, isResolving, hasFinished } = useQuerySelect(
		( resolve ) =>
			resolve( coreStore ).getMenus( { per_page: -1, context: 'view' } ),
		[]
	);
	return {
		menus: data,
		isResolvingMenus: isResolving,
		hasResolvedMenus: hasFinished,
		hasMenus: !! ( hasFinished && data?.length ),
	};
}

function useMenuItemEntities( menuId ) {
	const { data, hasFinished } = useQuerySelect(
		( resolve ) => {
			const hasSelectedMenu = menuId !== undefined;
			if ( ! hasSelectedMenu ) {
				return { hasFinished: false };
			}

			return resolve( coreStore ).getMenuItems( {
				menus: menuId,
				per_page: -1,
				context: 'view',
			} );
		},
		[ menuId ]
	);
	return { menuItems: data, hasResolvedMenuItems: hasFinished };
}

function usePageEntities() {
	const { data, isResolving, hasFinished } = useQuerySelect(
		( resolve ) =>
			resolve( coreStore ).getEntityRecords( 'postType', 'page', {
				parent: 0,
				order: 'asc',
				orderby: 'id',
				per_page: -1,
				context: 'view',
			} ),
		[]
	);

	return {
		pages: data,
		isResolvingPages: isResolving,
		hasResolvedPages: hasFinished,
		hasPages: !! ( hasFinished && data?.length ),
	};
}
