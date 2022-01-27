/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Manages fetching and resolution state for all entities required
 * for the Navigation block.
 *
 * @param {number} menuId the menu for which to retrieve menuItem data.
 * @return { Object } the entity data.
 */
export default function useNavigationEntities( menuId ) {
	const menus = useEntityRecords( 'root', 'menu', {
		per_page: -1,
		context: 'view',
	} );
	const pages = useEntityRecords( 'postType', 'page', {
		parent: 0,
		order: 'asc',
		orderby: 'id',
		per_page: -1,
		context: 'view',
	} );
	const menuItems = useEntityRecords(
		'root',
		'menuItem',
		{
			menus: menuId,
			per_page: -1,
			context: 'view',
		},
		{ runIf: menuId !== undefined }
	);

	return {
		menus,
		pages,
		menuItems,
	};
}

async function test() {
	try {
		const newRecord = await save();
		// save worked 100%
	} catch(e) {
		// access to error
	}
}
