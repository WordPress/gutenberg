/**
 * External dependencies
 */
import { keyBy, reduce, map, groupBy, flowRight, isEqual, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	assignPropertyDescriptors,
	getRawValue,
	ifMatchingAction,
	hasEnumerableProperties,
	replaceAction,
} from './utils';
import { reducer as queriedDataReducer } from './queried-data';
import { defaultEntities, DEFAULT_ENTITY_KEY } from './entities';

/**
 * Reducer managing terms state. Keyed by taxonomy slug, the value is either
 * undefined (if no request has been made for given taxonomy), null (if a
 * request is in-flight for given taxonomy), or the array of terms for the
 * taxonomy.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function terms( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_TERMS':
			return {
				...state,
				[ action.taxonomy ]: action.terms,
			};
	}

	return state;
}

/**
 * Reducer managing authors state. Keyed by id.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function users( state = { byId: {}, queries: {} }, action ) {
	switch ( action.type ) {
		case 'RECEIVE_USER_QUERY':
			return {
				byId: {
					...state.byId,
					...keyBy( action.users, 'id' ),
				},
				queries: {
					...state.queries,
					[ action.queryID ]: map( action.users, ( user ) => user.id ),
				},
			};
	}

	return state;
}

/**
 * Reducer managing current user state.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function currentUser( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_CURRENT_USER':
			return action.currentUser;
	}

	return state;
}

/**
 * Reducer managing taxonomies.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function taxonomies( state = [], action ) {
	switch ( action.type ) {
		case 'RECEIVE_TAXONOMIES':
			return action.taxonomies;
	}

	return state;
}

/**
 * Reducer managing theme supports data.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function themeSupports( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_THEME_SUPPORTS':
			return {
				...state,
				...action.themeSupports,
			};
	}

	return state;
}

const ifMatchingEntityConfig = ( reducer ) => ( entityConfig ) => flowRight( [
	// Limit to matching action type so we don't attempt to replace action on
	// an unhandled action.
	ifMatchingAction( ( action ) => (
		action.name &&
		action.kind &&
		action.name === entityConfig.name &&
		action.kind === entityConfig.kind
	) ),

	// Inject the entity config into the action.
	replaceAction( ( action ) => {
		return {
			...action,
			key: entityConfig.key || DEFAULT_ENTITY_KEY,
		};
	} ),
] )( reducer );

/**
 * Higher Order Reducer for a given entity config. It supports:
 *
 *  - Fetching a record by primary key
 *
 * @param {Object} entityConfig  Entity config.
 *
 * @return {Function} Reducer.
 */
const data = ifMatchingEntityConfig( queriedDataReducer );

const edits = ifMatchingEntityConfig( ( state = {}, action ) => {
	switch ( action.type ) {
		case 'EDIT_ENTITY_RECORD':
			// TODO: When assigning an edit which is equal to the current data
			// value, the edit should be omitted. This ensures that Undo to the
			// last save point is treated as non-dirty.
			return {
				...state,
				[ action.recordId ]: assignPropertyDescriptors(
					{},
					state[ action.recordId ],
					action.edits,
				),
			};

		case 'RECEIVE_ITEMS':
			let nextState = state;
			for ( const record of action.items ) {
				const recordId = record[ action.key ];
				if ( ! nextState.hasOwnProperty( recordId ) ) {
					continue;
				}

				const nextEdits = reduce( nextState[ recordId ], ( result, value, key ) => {
					// Deep equality avoids changing reference to a top-level
					// key if all its properties match.
					if ( ! isEqual( result[ key ], getRawValue( record[ key ] ) ) ) {
						return result;
					}

					if ( result === nextState[ recordId ] ) {
						result = assignPropertyDescriptors( {}, nextState[ recordId ] );
					}

					delete result[ key ];
					return result;
				}, nextState[ recordId ] );

				if ( nextEdits === nextState[ recordId ] ) {
					continue;
				}

				if ( nextState === state ) {
					nextState = { ...state };
				}

				if ( Object.getOwnPropertyNames( nextEdits ).length ) {
					nextState[ recordId ] = nextEdits;
				} else {
					delete nextState[ recordId ];
				}
			}

			return nextState;
	}

	return state;
} );

const saving = ifMatchingEntityConfig( ( state = {}, action ) => {
	switch ( action.type ) {
		case 'SAVE_ENTITY_RECORD_START':
		case 'SAVE_ENTITY_RECORD_FINISH':
			return {
				...state,
				[ action.recordId ]: {
					pending: action.type === 'SAVE_ENTITY_RECORD_START',
					error: action.error,
				},
			};
	}

	return state;
} );

/**
 * Reducer keeping track of the registered entities.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function entitiesConfig( state = defaultEntities, action ) {
	switch ( action.type ) {
		case 'ADD_ENTITIES':
			return [
				...state,
				...action.entities,
			];
	}

	return state;
}

/**
 * Reducer keeping track of the registered entities config and data.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function entities( state = {}, action ) {
	let { reducer, config } = state;

	const nextConfig = entitiesConfig( state.config, action );
	if ( nextConfig !== config ) {
		config = nextConfig;

		const entitiesByKind = groupBy( nextConfig, 'kind' );

		reducer = combineReducers( mapValues( {
			data,
			edits,
			saving,
		}, ( keyReducer ) => combineReducers(
			mapValues( entitiesByKind, ( subEntities ) => {
				return combineReducers( subEntities.reduce(
					( result, entityConfig ) => {
						result[ entityConfig.name ] = keyReducer( entityConfig );
						return result;
					},
					{}
				) );
			} )
		) ) );

		return {
			...state,
			reducer,
			config,
			...reducer( state, action ),
		};
	}

	const nextReducerResult = reducer( state, action );

	if (
		nextReducerResult.data !== state.data ||
		nextReducerResult.edits !== state.edits ||
		nextReducerResult.saving !== state.saving
	) {
		return {
			...state,
			...nextReducerResult,
		};
	}

	return state;
}

/**
 * Reducer managing embed preview data.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function embedPreviews( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_EMBED_PREVIEW':
			const { url, preview } = action;
			return {
				...state,
				[ url ]: preview,
			};
	}
	return state;
}

/**
 * State which tracks whether the user can perform an action on a REST
 * resource.
 *
 * @param  {Object} state  Current state.
 * @param  {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function userPermissions( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_USER_PERMISSION':
			return {
				...state,
				[ action.key ]: action.isAllowed,
			};
	}

	return state;
}

/**
 * Reducer returning autosaves keyed by their parent's post id.
 *
 * @param  {Object} state  Current state.
 * @param  {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function autosaves( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_AUTOSAVES':
			const { postId, autosaves: autosavesData } = action;

			return {
				...state,
				[ postId ]: autosavesData,
			};
	}

	return state;
}

export const undo = combineReducers( {
	stack( state = [], action ) {
		switch ( action.type ) {
			case 'EDIT_ENTITY_RECORD':
				// If editing in the context of a history operation, avoid
				// modifying the stack since there is no change to track.
				if ( action.meta.isUndo || action.meta.isRedo ) {
					return state;
				}

				// Non-enumerable properties are treated not as having their
				// own undo, but are reachable as of the next meaningful edit
				// to which they are merged.
				if ( ! hasEnumerableProperties( action.edits ) ) {
					state = [ ...state ];
					state.flattenedUndo = assignPropertyDescriptors(
						{},
						state.flattenedUndo,
						action.edits
					);

					return state;
				}

				let nextState;
				if ( state.length ) {
					nextState = [ ...state ];
				} else {
					// For the first, include an entry for the original values,
					// since  otherwise they would not be reachable for undo.
					nextState = [
						[
							action.meta.undo.kind,
							action.meta.undo.name,
							action.meta.undo.recordId,
							assignPropertyDescriptors(
								{},
								state.flattenedUndo,
								action.meta.undo.edits,
							),
						],
					];
				}

				nextState.push( [
					action.kind,
					action.name,
					action.recordId,
					assignPropertyDescriptors(
						{},
						state.flattenedUndo,
						action.edits,
					),
				] );

				return nextState;
		}

		return state;
	},
	currentOffset( state = -1, action ) {
		switch ( action.type ) {
			case 'EDIT_ENTITY_RECORD':
				if ( action.meta.isUndo ) {
					return state - 1;
				} else if ( action.meta.isRedo ) {
					return state + 1;
				}

				return -1;
		}

		return state;
	},
} );

export default combineReducers( {
	terms,
	users,
	currentUser,
	taxonomies,
	themeSupports,
	entities,
	embedPreviews,
	userPermissions,
	autosaves,
	undo,
} );
