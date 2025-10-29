/**
 * Internal dependencies
 */
import type { MenuItem } from './types';

export function registerMenuItem( id: string, menuItem: MenuItem ) {
	return {
		type: 'REGISTER_MENU_ITEM' as const,
		id,
		menuItem,
	};
}

export type Action = ReturnType< typeof registerMenuItem >;
