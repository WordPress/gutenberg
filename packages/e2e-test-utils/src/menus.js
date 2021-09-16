/**
 * Internal dependencies
 */
import { rest, batch } from './rest-api';

const menusEndpoint = '/__experimental/menus';
const menuItemsEndpoint = '/__experimental/menu-items';

export async function deleteAllMenus() {
	const menus = await rest( { path: menusEndpoint } );

	await batch(
		menus.map( ( menu ) => ( {
			method: 'DELETE',
			path: `${ menusEndpoint }/${ menu.id }?force=true`,
		} ) )
	);
}

export async function createMenu( menu, menuItems ) {
	const newMenu = await rest( {
		method: 'POST',
		path: menusEndpoint,
		data: menu,
	} );

	const menuItemRequests = menuItems?.map( ( menuItem ) => {
		return {
			method: 'POST',
			path: menuItemsEndpoint,
			body: {
				menus: newMenu.id,
				...menuItem,
				// We need ids for the menu items first before we're able
				// to set the correct parent id. Set `0` as the parent in
				// this first request to get the ids.
				parent: undefined,
			},
		};
	} );

	if ( menuItemRequests?.length ) {
		const response = await batch( menuItemRequests );

		// Make a second batch request to assign parents.
		const menuItemsWithParentRequests = menuItems
			.map( ( menuItem, index ) => {
				// In the fixture data, the parent corresponds to the
				// index in the array, dereference that to find the actual
				// menu item id.
				const fixtureParentIndex = menuItem?.parent !== undefined;

				// Skip any menu items that are top level.
				if ( ! fixtureParentIndex ) {
					return undefined;
				}

				const parent = response.responses[ menuItem.parent ].body.id;
				const menuItemId = response.responses[ index ].body.id;

				return {
					method: 'PUT',
					path: `${ menuItemsEndpoint }/${ menuItemId }`,
					body: { parent },
				};
			} )
			.filter( ( menuItem ) => !! menuItem );

		await batch( menuItemsWithParentRequests );
	}
}
