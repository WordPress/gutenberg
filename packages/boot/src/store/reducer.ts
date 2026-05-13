/**
 * Internal dependencies
 */
import type { Action } from './actions';
import type { State } from './types';

const initialState: State = {
	menuItems: {},
	routes: [],
	dashboardLink: undefined,
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

		case 'UPDATE_MENU_ITEM':
			return {
				...state,
				menuItems: {
					...state.menuItems,
					[ action.id ]: {
						...state.menuItems[ action.id ],
						...action.updates,
					},
				},
			};

		case 'REGISTER_ROUTE':
			return {
				...state,
				routes: [ ...state.routes, action.route ],
			};

		case 'SET_DASHBOARD_LINK':
			return {
				...state,
				dashboardLink: action.dashboardLink,
			};
	}

	return state;
}
