/**
 * Internal dependencies
 */
import type { ShortcutAction } from './actions';
import type { ShortcutsState } from './types';

/**
 * Reducer returning the registered shortcuts
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
function reducer(
	state: ShortcutsState = {},
	action: ShortcutAction
): ShortcutsState {
	switch ( action.type ) {
		case 'REGISTER_SHORTCUT':
			return {
				...state,
				[ action.name ]: {
					category: action.category,
					keyCombination: action.keyCombination,
					aliases: action.aliases,
					description: action.description,
				},
			};
		case 'UNREGISTER_SHORTCUT':
			const { [ action.name ]: actionName, ...remainingState } = state;
			return remainingState;
	}

	return state;
}

export default reducer;
