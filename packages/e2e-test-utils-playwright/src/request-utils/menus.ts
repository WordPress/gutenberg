/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface MenuData {
	title: string;
	content: string;
}
export interface Navigation {
	id: number;
	content: string;
	status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
}

/**
 * Create a navigation menu
 *
 * @param {Object} menuData navigation menu post data.
 * @return {string} Menu content.
 */
export async function createNavigationMenu(
	this: RequestUtils,
	menuData: MenuData
) {
	return this.rest( {
		method: 'POST',
		path: `/wp/v2/navigation/`,
		data: {
			status: 'publish',
			...menuData,
		},
	} );
}

/**
 * Delete all navigation menus
 *
 */
export async function deleteAllNavigationMenus( this: RequestUtils ) {
	const menus = await this.rest< Navigation[] >( {
		path: `/wp/v2/navigation/`,
	} );

	if ( ! menus?.length ) return;

	await this.batchRest(
		menus.map( ( menu ) => ( {
			method: 'DELETE',
			path: `/wp/v2/navigation/${ menu.id }?force=true`,
		} ) )
	);
}
