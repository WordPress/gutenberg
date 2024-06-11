/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import type { Action } from '@wordpress/dataviews';

type ReduxAction =
	| ReturnType< typeof import('./private-actions').registerEntityAction >
	| ReturnType< typeof import('./private-actions').unregisterEntityAction >;

export type ActionState = Record< string, Record< string, Action< any >[] > >;
export type State = {
	actions: ActionState;
};

function actions( state: ActionState = {}, action: ReduxAction ) {
	switch ( action.type ) {
		case 'REGISTER_ENTITY_ACTION':
			return {
				...state,
				[ action.kind ]: {
					[ action.name ]: [
						...( state[ action.kind ]?.[ action.name ] ?? [] ),
						action.config,
					],
				},
			};
		case 'UNREGISTER_ENTITY_ACTION': {
			return {
				...state,
				[ action.kind ]: (
					state[ action.kind ]?.[ action.name ] ?? []
				).filter( ( _action ) => _action.id !== action.actionId ),
			};
		}
	}

	return state;
}

export default combineReducers( {
	actions,
} );
