/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface MenuData {
	title: string;
	content: string;
}
export interface NavigationMenu {
	id: number;
	content: string;
	status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
}

/**
 * Create a classic menu
 *
 * @param name Menu name.
 * @return Menu content.
 */
export async function createClassicMenu( this: RequestUtils, name: string ) {
	const menuItems = [
		{
			title: 'Custom link',
			url: 'http://localhost:8889/',
			type: 'custom',
			menu_order: 1,
		},
	];

	const menu = await this.rest< NavigationMenu >( {
		method: 'POST',
		path: `/wp/v2/menus/`,
		data: {
			name,
		},
	} );

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

	return menu;
}

/**
 * Create a navigation menu
 *
 * @param menuData navigation menu post data.
 * @return Menu content.
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
	const navMenus = await this.rest< NavigationMenu[] >( {
		path: `/wp/v2/navigation/`,
		data: {
			status: [
				'publish',
				'pending',
				'draft',
				'auto-draft',
				'future',
				'private',
				'inherit',
				'trash',
			],
		},
	} );

	if ( navMenus.length ) {
		await this.batchRest(
			navMenus.map( ( menu ) => ( {
				method: 'DELETE',
				path: `/wp/v2/navigation/${ menu.id }?force=true`,
			} ) )
		);
	}

	const classicMenus = await this.rest< NavigationMenu[] >( {
		path: `/wp/v2/menus/`,
		data: {
			status: [
				'publish',
				'pending',
				'draft',
				'auto-draft',
				'future',
				'private',
				'inherit',
				'trash',
			],
		},
	} );

	if ( classicMenus.length ) {
		await this.batchRest(
			classicMenus.map( ( menu ) => ( {
				method: 'DELETE',
				path: `/wp/v2/menus/${ menu.id }?force=true`,
			} ) )
		);
	}
}

/**
 * Get latest navigation menus
 *
 * @param  args
 * @param  args.status
 * @return {string} Menu content.
 */
export async function getNavigationMenus(
	this: RequestUtils,
	args: { status: 'publish' }
) {
	const navigationMenus = await this.rest< NavigationMenu[] >( {
		method: 'GET',
		path: `/wp/v2/navigation/`,
		data: args,
	} );
	return navigationMenus;
}
