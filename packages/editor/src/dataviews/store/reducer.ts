import { combineReducers } from '@wordpress/data';
import type { Field } from '@wordpress/dataviews';

type ReduxAction =
	| ReturnType< typeof import( './private-actions' ).receiveEntityFields >
	| ReturnType< typeof import( './private-actions' ).setIsReady >;

export type FieldsState = Record< string, Record< string, Field< any >[] > >;
export type ReadyState = Record< string, Record< string, boolean > >;
export type State = {
	fields: FieldsState;
	isReady: ReadyState;
};

function isReady( state: ReadyState = {}, action: ReduxAction ) {
	switch ( action.type ) {
		case 'SET_IS_READY':
			return {
				...state,
				[ action.kind ]: {
					...state[ action.kind ],
					[ action.name ]: true,
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
	fields,
	isReady,
} );
