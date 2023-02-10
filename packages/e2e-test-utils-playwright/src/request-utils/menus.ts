/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface MenuData {
	title: string;
	content: string;
}
export interface Menu {
	id: number;
	content: string;
	status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
}

/**
 * Create a classic menu
 *
 * @param {string} name Menu name.
 * @return {string} Menu content.
 */
export async function createClassicMenu( this: RequestUtils, name: string ) {
	const menuItems = [
		{
			title: 'Home',
			url: 'http://localhost:8889/',
			type: 'custom',
			menu_order: 1,
		},
	];

	const menu = await this.rest< Menu >( {
		method: 'POST',
		path: `/wp/v2/menus/`,
		data: {
			name,
		},
	} );

	if ( menuItems?.length ) {
		await this.batchRest(
			menuItems.map( ( menuItem ) => ( {
				method: 'POST',
				path: `/wp/v2/menu-items`,
				body: {
					menus: menu.id,
					object_id: undefined,
					...menuItem,
					parent: undefined,
				},
			} ) )
		);
	}

	return menu;
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
 * Delete all navigation and classic menus
 *
 */
export async function deleteAllMenus( this: RequestUtils ) {
	const navMenus = await this.rest< Menu[] >( {
		path: `/wp/v2/navigation/`,
	} );

	if ( navMenus?.length ) {
		await this.batchRest(
			navMenus.map( ( menu ) => ( {
				method: 'DELETE',
				path: `/wp/v2/navigation/${ menu.id }?force=true`,
			} ) )
		);
	}

	const classicMenus = await this.rest< Menu[] >( {
		path: `/wp/v2/menus/`,
	} );

	if ( classicMenus?.length ) {
		await this.batchRest(
			classicMenus.map( ( menu ) => ( {
				method: 'DELETE',
				path: `/wp/v2/menus/${ menu.id }?force=true`,
			} ) )
		);
	}
}
