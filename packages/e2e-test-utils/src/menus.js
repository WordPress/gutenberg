/**
 * Internal dependencies
 */
import { rest, batch } from './rest-api';

const menusEndpoint = '/wp/v2/menus';
const menuItemsEndpoint = '/wp/v2/menu-items';

const menuItemObjectRequests = {
	post: ( menuItem ) => ( {
		path: '/wp/v2/posts',
		method: 'POST',
		data: {
			title: menuItem.title,
			status: 'publish',
		},
	} ),
	page: ( menuItem ) => ( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			title: menuItem.title,
			status: 'publish',
		},
	} ),
};

const menuItemObjectMatchers = {
	post: ( menuItem, post ) => menuItem.title === post.title.raw,
	page: ( menuItem, page ) => menuItem.title === page.title.raw,
};

/**
 * Delete all menus using the REST API
 */
export async function deleteAllMenus() {
	const menus = await rest( { path: menusEndpoint } );

	await batch(
		menus.map( ( menu ) => ( {
			method: 'DELETE',
			path: `${ menusEndpoint }/${ menu.id }?force=true`,
		} ) )
	);
}

/**
 * Create menus and all linked resources for the menu using the REST API.
 *
 * @param {Object} menu      Rest payload for the menu
 * @param {?Array} menuItems Data for any menu items to be created.
 */
export async function createMenu( menu, menuItems ) {
	// Step 1. Create the menu.
	const menuResponse = await rest( {
		method: 'POST',
		path: menusEndpoint,
		data: menu,
	} );

	if ( ! menuItems?.length ) {
		return;
	}

	// Step 2. Create all the pages/posts/categories etc. that menu items
	// are linked to. These items don't support rest batching so create them
	// using individual requests.
	const objectRequests = menuItems
		.map( ( menuItem ) => {
			const getRequest = menuItemObjectRequests[ menuItem.object ];
			return getRequest ? getRequest( menuItem ) : undefined;
		} )
		.filter( ( request ) => !! request );
	const objectResponses = [];
	for ( const objectRequest of objectRequests ) {
		const objectResponse = await rest( objectRequest );
		objectResponses.push( objectResponse );
	}

	// Step 3. Create the initial menu items without assigned parents. We need
	// the ids of all the menu items first before being able to assign the
	// correct id of the parent.
	const menuItemsResponse = await batch(
		menuItems.map( ( menuItem ) => {
			// If the menu item is linked to an 'object', get the id for that
			// object.
			const objectMatcher = menuItemObjectMatchers[ menuItem.object ];
			let object;
			if ( objectMatcher ) {
				object = objectResponses.find( ( objectResponse ) =>
					objectMatcher( menuItem, objectResponse )
				);
			}

			return {
				method: 'POST',
				path: menuItemsEndpoint,
				body: {
					menus: menuResponse.id,
					object_id: object?.id,
					url: object?.link,
					...menuItem,
					parent: undefined,
				},
			};
		} )
	);

	// Step 4. Make another menu item request to assign parents.
	await batch(
		menuItems
			.map( ( menuItem, index ) => {
				// In the fixture data, the parent corresponds to the
				// index in the array, dereference that to find the actual
				// menu item id.
				const fixtureParentIndex = menuItem?.parent !== undefined;

				// Skip any menu items that are top level.
				if ( ! fixtureParentIndex ) {
					return undefined;
				}

				const parent =
					menuItemsResponse.responses[ menuItem.parent ].body.id;
				const menuItemResponse = menuItemsResponse.responses[ index ];
				const menuItemId = menuItemResponse.body.id;

				return {
					method: 'PUT',
					path: `${ menuItemsEndpoint }/${ menuItemId }`,
					body: { ...menuItemResponse.body, parent },
				};
			} )
			.filter( ( request ) => !! request )
	);
}
