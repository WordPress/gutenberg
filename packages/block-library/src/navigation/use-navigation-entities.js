/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * @typedef {Object} NavigationEntitiesData
 * @property {Array|undefined} pages - a collection of WP Post entity objects of post type "Page".
 * @property {boolean} isResolvingPages - indicates whether the request to fetch pages is currently resolving.
 * @property {boolean} hasResolvedPages - indicates whether the request to fetch pages has finished resolving.
 * @property {Array|undefined} menus - a collection of Menu entity objects.
 * @property {boolean} isResolvingMenus - indicates whether the request to fetch menus is currently resolving.
 * @property {boolean} hasResolvedMenus - indicates whether the request to fetch menus has finished resolving.
 * @property {Array|undefined} menusItems - a collection of Menu Item entity objects for the current menuId.
 * @property {boolean} hasResolvedMenuItems - indicates whether the request to fetch menuItems has finished resolving.
 * @property {boolean} hasPages - indicates whether there is currently any data for pages.
 * @property {boolean} hasMenus - indicates whether there is currently any data for menus.
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
		...useMenuEntities( menuId ),
	};
}

function useMenuEntities( menuId ) {
	const {
		menus,
		isResolvingMenus,
		hasResolvedMenus,
		menuItems,
		hasResolvedMenuItems,
	} = useSelect(
		( select ) => {
			const {
				getMenus,
				getMenuItems,
				isResolving,
				hasFinishedResolution,
			} = select( coreStore );

			const menusParameters = [ { per_page: -1 } ];
			const hasSelectedMenu = menuId !== undefined;
			const menuItemsParameters = hasSelectedMenu
				? [
						{
							menus: menuId,
							per_page: -1,
						},
				  ]
				: undefined;

			return {
				menus: getMenus( ...menusParameters ),
				isResolvingMenus: isResolving( 'getMenus', menusParameters ),
				hasResolvedMenus: hasFinishedResolution(
					'getMenus',
					menusParameters
				),
				menuItems: hasSelectedMenu
					? getMenuItems( ...menuItemsParameters )
					: undefined,
				hasResolvedMenuItems: hasSelectedMenu
					? hasFinishedResolution(
							'getMenuItems',
							menuItemsParameters
					  )
					: false,
			};
		},
		[ menuId ]
	);

	return {
		menus,
		isResolvingMenus,
		hasResolvedMenus,
		menuItems,
		hasResolvedMenuItems,
		hasMenus: !! ( hasResolvedMenus && menus?.length ),
	};
}

function usePageEntities() {
	const { pages, isResolvingPages, hasResolvedPages } = useSelect(
		( select ) => {
			const {
				getEntityRecords,
				isResolving,
				hasFinishedResolution,
			} = select( coreStore );

			const pagesParameters = [
				'postType',
				'page',
				{
					parent: 0,
					order: 'asc',
					orderby: 'id',
					per_page: -1,
				},
			];

			return {
				pages: getEntityRecords( ...pagesParameters ),
				isResolvingPages: isResolving(
					'getEntityRecords',
					pagesParameters
				),
				hasResolvedPages: hasFinishedResolution(
					'getEntityRecords',
					pagesParameters
				),
			};
		}
	);

	return {
		pages,
		isResolvingPages,
		hasResolvedPages,
		hasPages: !! ( hasResolvedPages && pages?.length ),
	};
}
