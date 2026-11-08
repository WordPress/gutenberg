import type { EntityLinks, MenuItem, Route } from './types';

export function registerMenuItem( id: string, menuItem: MenuItem ) {
	return {
		type: 'REGISTER_MENU_ITEM' as const,
		id,
		menuItem,
	};
}

export function updateMenuItem( id: string, updates: Partial< MenuItem > ) {
	return {
		type: 'UPDATE_MENU_ITEM' as const,
		id,
		updates,
	};
}

export function registerRoute( route: Route ) {
	return {
		type: 'REGISTER_ROUTE' as const,
		route,
	};
}

/**
 * Registers where entities of a post type are listed and edited.
 *
 * Register `default` to cover post types with no entry of their own.
 *
 * @param postType Post type the links belong to, or `default`.
 * @param links    Paths to list and edit an entity of that post type.
 */
export function registerEntityLinks( postType: string, links: EntityLinks ) {
	return {
		type: 'REGISTER_ENTITY_LINKS' as const,
		postType,
		links,
	};
}

export function setDashboardLink( dashboardLink: string ) {
	return {
		type: 'SET_DASHBOARD_LINK' as const,
		dashboardLink,
	};
}

export type Action =
	| ReturnType< typeof registerMenuItem >
	| ReturnType< typeof updateMenuItem >
	| ReturnType< typeof registerRoute >
	| ReturnType< typeof registerEntityLinks >
	| ReturnType< typeof setDashboardLink >;
