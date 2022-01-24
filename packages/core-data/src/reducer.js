/**
 * External dependencies
 */
import { keyBy, map, groupBy, flowRight, isEqual, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { ifMatchingAction, replaceAction } from './utils';
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
					[ action.queryID ]: map(
						action.users,
						( user ) => user.id
					),
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
 * Reducer managing the current theme.
 *
 * @param {string} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function currentTheme( state = undefined, action ) {
	switch ( action.type ) {
		case 'RECEIVE_CURRENT_THEME':
			return action.currentTheme.stylesheet;
	}

	return state;
}

/**
 * Reducer managing the current global styles id.
 *
 * @param {string} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function currentGlobalStylesId( state = undefined, action ) {
	switch ( action.type ) {
		case 'RECEIVE_CURRENT_GLOBAL_STYLES_ID':
			return action.id;
	}

	return state;
}

/**
 * Reducer managing the theme base global styles.
 *
 * @param {string} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function themeBaseGlobalStyles( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_THEME_GLOBAL_STYLES':
			return {
				...state,
				[ action.stylesheet ]: action.globalStyles,
			};
	}

	return state;
}

/**
 * Higher Order Reducer for a given entity config. It supports:
 *
 *  - Fetching
 *  - Editing
 *  - Saving
 *
 * @param {Object} entityConfig Entity config.
 *
 * @return {Function} Reducer.
 */
function entity( entityConfig ) {
	return flowRight( [
		// Limit to matching action type so we don't attempt to replace action on
		// an unhandled action.
		ifMatchingAction(
			( action ) =>
				action.name &&
				action.kind &&
				action.name === entityConfig.name &&
				action.kind === entityConfig.kind
		),

		// Inject the entity config into the action.
		replaceAction( ( action ) => {
			return {
				...action,
				key: entityConfig.key || DEFAULT_ENTITY_KEY,
			};
		} ),
	] )(
		combineReducers( {
			queriedData: queriedDataReducer,

			edits: ( state = {}, action ) => {
				switch ( action.type ) {
					case 'RECEIVE_ITEMS':
						const context = action?.query?.context ?? 'default';
						if ( context !== 'default' ) {
							return state;
						}

						const nextState = { ...state };

						for ( const record of action.items ) {
							const recordId = record[ action.key ];
							const edits = nextState[ recordId ];
							if ( ! edits ) {
								continue;
							}

							const nextEdits = Object.keys( edits ).reduce(
								( acc, key ) => {
									// If the edited value is still different to the persisted value,
									// keep the edited value in edits.
									if (
										// Edits are the "raw" attribute values, but records may have
										// objects with more properties, so we use `get` here for the
										// comparison.
										! isEqual(
											edits[ key ],
											get(
												record[ key ],
												'raw',
												record[ key ]
											)
										) &&
										// Sometimes the server alters the sent value which means
										// we need to also remove the edits before the api request.
										( ! action.persistedEdits ||
											! isEqual(
												edits[ key ],
												action.persistedEdits[ key ]
											) )
									) {
										acc[ key ] = edits[ key ];
									}
									return acc;
								},
								{}
							);

							if ( Object.keys( nextEdits ).length ) {
								nextState[ recordId ] = nextEdits;
							} else {
								delete nextState[ recordId ];
							}
						}

						return nextState;

					case 'EDIT_ENTITY_RECORD':
						const nextEdits = {
							...state[ action.recordId ],
							...action.edits,
						};
						Object.keys( nextEdits ).forEach( ( key ) => {
							// Delete cleared edits so that the properties
							// are not considered dirty.
							if ( nextEdits[ key ] === undefined ) {
								delete nextEdits[ key ];
							}
						} );
						return {
							...state,
							[ action.recordId ]: nextEdits,
						};
				}

				return state;
			},

			saving: ( state = {}, action ) => {
				switch ( action.type ) {
					case 'SAVE_ENTITY_RECORD_START':
					case 'SAVE_ENTITY_RECORD_FINISH':
						return {
							...state,
							[ action.recordId ]: {
								pending:
									action.type === 'SAVE_ENTITY_RECORD_START',
								error: action.error,
								isAutosave: action.isAutosave,
							},
						};
				}

				return state;
			},

			deleting: ( state = {}, action ) => {
				switch ( action.type ) {
					case 'DELETE_ENTITY_RECORD_START':
					case 'DELETE_ENTITY_RECORD_FINISH':
						return {
							...state,
							[ action.recordId ]: {
								pending:
									action.type ===
									'DELETE_ENTITY_RECORD_START',
								error: action.error,
							},
						};
				}

				return state;
			},
		} )
	);
}

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
			return [ ...state, ...action.entities ];
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
export const entities = ( state = {}, action ) => {
	const newConfig = entitiesConfig( state.config, action );

	// Generates a dynamic reducer for the entities
	let entitiesDataReducer = state.reducer;
	if ( ! entitiesDataReducer || newConfig !== state.config ) {
		const entitiesByKind = groupBy( newConfig, 'kind' );
		entitiesDataReducer = combineReducers(
			Object.entries( entitiesByKind ).reduce(
				( memo, [ kind, subEntities ] ) => {
					const kindReducer = combineReducers(
						subEntities.reduce(
							( kindMemo, entityConfig ) => ( {
								...kindMemo,
								[ entityConfig.name ]: entity( entityConfig ),
							} ),
							{}
						)
					);

					memo[ kind ] = kindReducer;
					return memo;
				},
				{}
			)
		);
	}

	const newData = entitiesDataReducer( state.data, action );

	if (
		newData === state.data &&
		newConfig === state.config &&
		entitiesDataReducer === state.reducer
	) {
		return state;
	}

	return {
		reducer: entitiesDataReducer,
		data: newData,
		config: newConfig,
	};
};

/**
 * Reducer keeping track of entity edit undo history.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
const UNDO_INITIAL_STATE = [];
UNDO_INITIAL_STATE.offset = 0;
let lastEditAction;
export function undo( state = UNDO_INITIAL_STATE, action ) {
	switch ( action.type ) {
		case 'EDIT_ENTITY_RECORD':
		case 'CREATE_UNDO_LEVEL':
			let isCreateUndoLevel = action.type === 'CREATE_UNDO_LEVEL';
			const isUndoOrRedo =
				! isCreateUndoLevel &&
				( action.meta.isUndo || action.meta.isRedo );
			if ( isCreateUndoLevel ) {
				action = lastEditAction;
			} else if ( ! isUndoOrRedo ) {
				// Don't lose the last edit cache if the new one only has transient edits.
				// Transient edits don't create new levels so updating the cache would make
				// us skip an edit later when creating levels explicitly.
				if (
					Object.keys( action.edits ).some(
						( key ) => ! action.transientEdits[ key ]
					)
				) {
					lastEditAction = action;
				} else {
					lastEditAction = {
						...action,
						edits: {
							...( lastEditAction && lastEditAction.edits ),
							...action.edits,
						},
					};
				}
			}

			let nextState;
			if ( isUndoOrRedo ) {
				nextState = [ ...state ];
				nextState.offset =
					state.offset + ( action.meta.isUndo ? -1 : 1 );

				if ( state.flattenedUndo ) {
					// The first undo in a sequence of undos might happen while we have
					// flattened undos in state. If this is the case, we want execution
					// to continue as if we were creating an explicit undo level. This
					// will result in an extra undo level being appended with the flattened
					// undo values.
					// We also have to take into account if the `lastEditAction` had opted out
					// of being tracked in undo history, like the action that persists the latest
					// content right before saving. In that case we have to update the `lastEditAction`
					// to avoid returning early before applying the existing flattened undos.
					isCreateUndoLevel = true;
					if ( ! lastEditAction.meta.undo ) {
						lastEditAction.meta.undo = {
							edits: {},
						};
					}
					action = lastEditAction;
				} else {
					return nextState;
				}
			}

			if ( ! action.meta.undo ) {
				return state;
			}

			// Transient edits don't create an undo level, but are
			// reachable in the next meaningful edit to which they
			// are merged. They are defined in the entity's config.
			if (
				! isCreateUndoLevel &&
				! Object.keys( action.edits ).some(
					( key ) => ! action.transientEdits[ key ]
				)
			) {
				nextState = [ ...state ];
				nextState.flattenedUndo = {
					...state.flattenedUndo,
					...action.edits,
				};
				nextState.offset = state.offset;
				return nextState;
			}

			// Clear potential redos, because this only supports linear history.
			nextState =
				nextState || state.slice( 0, state.offset || undefined );
			nextState.offset = nextState.offset || 0;
			nextState.pop();
			if ( ! isCreateUndoLevel ) {
				nextState.push( {
					kind: action.meta.undo.kind,
					name: action.meta.undo.name,
					recordId: action.meta.undo.recordId,
					edits: {
						...state.flattenedUndo,
						...action.meta.undo.edits,
					},
				} );
			}
			// When an edit is a function it's an optimization to avoid running some expensive operation.
			// We can't rely on the function references being the same so we opt out of comparing them here.
			const comparisonUndoEdits = Object.values(
				action.meta.undo.edits
			).filter( ( edit ) => typeof edit !== 'function' );
			const comparisonEdits = Object.values( action.edits ).filter(
				( edit ) => typeof edit !== 'function'
			);
			if ( ! isShallowEqual( comparisonUndoEdits, comparisonEdits ) ) {
				nextState.push( {
					kind: action.kind,
					name: action.name,
					recordId: action.recordId,
					edits: isCreateUndoLevel
						? { ...state.flattenedUndo, ...action.edits }
						: action.edits,
				} );
			}
			return nextState;
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
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
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
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
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

export default combineReducers( {
	terms,
	users,
	currentTheme,
	currentGlobalStylesId,
	currentUser,
	themeBaseGlobalStyles,
	taxonomies,
	entities,
	undo,
	embedPreviews,
	userPermissions,
	autosaves,
} );
