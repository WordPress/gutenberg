/**
 * Internal dependencies
 */
import type { CSSRuleState } from './types';
import * as actions from './actions';

/**
 * Reducer returning the style engine state.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */

function reducer( state: CSSRuleState = {}, action: actions.StyleAction ) {
	switch ( action.type ) {
		case actions.CREATE_STYLE:
			if ( !! state[ action.selector ] ) {
				return {
					...state,
					[ action.selector ]: {
						...state[ action.selector ],
						...action.value,
					},
				};
			}
			return {
				...state,
				[ action.selector ]: {
					...action.value,
				},
			};
		case actions.UPDATE_STYLE:
			return {
				...state,
				[ action.selector ]: {
					...state[ action.selector ],
					...action.value,
				},
			};
		case actions.DELETE_STYLE:
			const { [ action.selector ]: value, ...newState } = state;
			return newState;
	}

	return state;
}

export default reducer;
