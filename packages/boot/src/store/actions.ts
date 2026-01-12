/**
 * Internal dependencies
 */
import type { MenuItem, Route, PageConfig } from './types';

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

export function setDashboardLink( dashboardLink: string ) {
	return {
		type: 'SET_DASHBOARD_LINK' as const,
		dashboardLink,
	};
}

export function setPageConfig( pageConfig: PageConfig ) {
	return {
		type: 'SET_PAGE_CONFIG' as const,
		pageConfig,
	};
}

export type Action =
	| ReturnType< typeof registerMenuItem >
	| ReturnType< typeof updateMenuItem >
	| ReturnType< typeof registerRoute >
	| ReturnType< typeof setDashboardLink >
	| ReturnType< typeof setPageConfig >;
