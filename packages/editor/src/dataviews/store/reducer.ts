import { combineReducers } from '@wordpress/data';
import type { Action, Field } from '@wordpress/dataviews';

type ReduxAction =
	| ReturnType< typeof import( './private-actions' ).receiveEntityActions >
	| ReturnType< typeof import( './private-actions' ).receiveEntityFields >;

export type ActionState = Record< string, Record< string, Action< any >[] > >;
export type FieldsState = Record< string, Record< string, Field< any >[] > >;
export type State = {
	actions: ActionState;
	fields: FieldsState;
};

/*
 * The actions of each entity, keyed by kind, then name, as the
 * `getEntityActions` resolver receives them from the server.
 */
function actions( state: ActionState = {}, action: ReduxAction ) {
	switch ( action.type ) {
		case 'RECEIVE_ENTITY_ACTIONS':
			return {
				...state,
				[ action.kind ]: {
					...state[ action.kind ],
					[ action.name ]: action.actions,
				},
			};
	}

	return state;
}

/*
 * The fields of each entity, keyed by kind, then name, as the
 * `getEntityFields` resolver receives them from the server.
 */
function fields( state: FieldsState = {}, action: ReduxAction ) {
	switch ( action.type ) {
		case 'RECEIVE_ENTITY_FIELDS':
			return {
				...state,
				[ action.kind ]: {
					...state[ action.kind ],
					[ action.name ]: action.fields,
				},
			};
	}

	return state;
}

export default combineReducers( {
	actions,
	fields,
} );
