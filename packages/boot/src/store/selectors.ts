/**
 * Internal dependencies
 */
import type { State } from './types';

export function getMenuItems( state: State ) {
	return Object.values( state.menuItems );
}
