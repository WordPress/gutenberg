/**
 * Internal dependencies
 */
import type { Action } from './private-actions';
import type { State } from './types';

const DEFAULT_STATE: State = {
	fieldCollections: {},
};

/**
 * Reducer for managing field collections state.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 * @return New state.
 */
export default function reducer(
	state: State = DEFAULT_STATE,
	action: Action
): State {
	switch ( action.type ) {
		case 'RECEIVE_ENTITY_FIELD_COLLECTIONS': {
			const key = `${ action.kind }-${ action.name }`;
			return {
				...state,
				fieldCollections: {
					...state.fieldCollections,
					[ key ]: action.collections,
				},
			};
		}
		default:
			return state;
	}
}
