/**
 * Internal dependencies
 */
import type { Action } from './actions';
import type { State } from './types';

const initialState: State = {
	menuItems: {},
	routes: [],
};

export function reducer( state: State = initialState, action: Action ): State {
	switch ( action.type ) {
		case 'REGISTER_MENU_ITEM':
			return {
				...state,
				menuItems: {
					...state.menuItems,
					[ action.id ]: action.menuItem,
				},
			};

		case 'REGISTER_ROUTE':
			return {
				...state,
				routes: [ ...state.routes, action.route ],
			};
	}

	return state;
}
