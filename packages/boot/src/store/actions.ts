/**
 * Internal dependencies
 */
import type { MenuItem, Route } from './types';

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

export type Action =
	| ReturnType< typeof registerMenuItem >
	| ReturnType< typeof updateMenuItem >
	| ReturnType< typeof registerRoute >;
