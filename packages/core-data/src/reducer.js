/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { combineReducers } from '@wordpress/data';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { ifMatchingAction, replaceAction } from './utils';
import { reducer as queriedDataReducer } from './queried-data';
import { rootEntitiesConfig, DEFAULT_ENTITY_KEY } from './entities';

/** @typedef {import('./types').AnyFunction} AnyFunction */

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
					// Key users by their ID.
					...action.users.reduce(
						( newUsers, user ) => ( {
							...newUsers,
							[ user.id ]: user,
						} ),
						{}
					),
				},
				queries: {
					...state.queries,
					[ action.queryID ]: action.users.map( ( user ) => user.id ),
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
 * @param {string|undefined} state  Current state.
 * @param {Object}           action Dispatched action.
 *
 * @return {string|undefined} Updated state.
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
 * @param {string|undefined} state  Current state.
 * @param {Object}           action Dispatched action.
 *
 * @return {string|undefined} Updated state.
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
 * @param {Record<string, object>} state  Current state.
 * @param {Object}                 action Dispatched action.
 *
 * @return {Record<string, object>} Updated state.
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
 * Reducer managing the theme global styles variations.
 *
 * @param {Record<string, object>} state  Current state.
 * @param {Object}                 action Dispatched action.
 *
 * @return {Record<string, object>} Updated state.
 */
export function themeGlobalStyleVariations( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_THEME_GLOBAL_STYLE_VARIATIONS':
			return {
				...state,
				[ action.stylesheet ]: action.variations,
			};
	}

	return state;
}

const withMultiEntityRecordEdits = ( reducer ) => ( state, action ) => {
	if ( action.type === 'UNDO' || action.type === 'REDO' ) {
		const { stackedEdits } = action;

		let newState = state;
		stackedEdits.forEach(
			( { kind, name, recordId, property, from, to } ) => {
				newState = reducer( newState, {
					type: 'EDIT_ENTITY_RECORD',
					kind,
					name,
					recordId,
					edits: {
						[ property ]: action.type === 'UNDO' ? from : to,
					},
				} );
			}
		);
		return newState;
	}

	return reducer( state, action );
};

/**
 * Higher Order Reducer for a given entity config. It supports:
 *
 *  - Fetching
 *  - Editing
 *  - Saving
 *
 * @param {Object} entityConfig Entity config.
 *
 * @return {AnyFunction} Reducer.
 */
function entity( entityConfig ) {
	return compose( [
		withMultiEntityRecordEdits,

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
										! fastDeepEqual(
											edits[ key ],
											record[ key ]?.raw ?? record[ key ]
										) &&
										// Sometimes the server alters the sent value which means
										// we need to also remove the edits before the api request.
										( ! action.persistedEdits ||
											! fastDeepEqual(
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
export function entitiesConfig( state = rootEntitiesConfig, action ) {
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

	// Generates a dynamic reducer for the entities.
	let entitiesDataReducer = state.reducer;
	if ( ! entitiesDataReducer || newConfig !== state.config ) {
		const entitiesByKind = newConfig.reduce( ( acc, record ) => {
			const { kind } = record;
			if ( ! acc[ kind ] ) {
				acc[ kind ] = [];
			}
			acc[ kind ].push( record );
			return acc;
		}, {} );

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

	const newData = entitiesDataReducer( state.records, action );

	if (
		newData === state.records &&
		newConfig === state.config &&
		entitiesDataReducer === state.reducer
	) {
		return state;
	}

	return {
		reducer: entitiesDataReducer,
		records: newData,
		config: newConfig,
	};
};

/**
 * @typedef {Object} UndoStateMeta
 *
 * @property {number} list   The undo stack.
 * @property {number} offset Where in the undo stack we are.
 * @property {Object} cache  Cache of unpersisted transient edits.
 */

/** @typedef {Array<Object> & UndoStateMeta} UndoState */

/**
 * @type {UndoState}
 *
 * @todo Given how we use this we might want to make a custom class for it.
 */
const UNDO_INITIAL_STATE = { list: [], offset: 0 };

/**
 * Reducer keeping track of entity edit undo history.
 *
 * @param {UndoState} state  Current state.
 * @param {Object}    action Dispatched action.
 *
 * @return {UndoState} Updated state.
 */
export function undo( state = UNDO_INITIAL_STATE, action ) {
	const omitPendingRedos = ( currentState ) => {
		return {
			...currentState,
			list: currentState.list.slice(
				0,
				currentState.offset || undefined
			),
			offset: 0,
		};
	};

	const appendCachedEditsToLastUndo = ( currentState ) => {
		if ( ! currentState.cache ) {
			return currentState;
		}

		let nextState = {
			...currentState,
			list: [ ...currentState.list ],
		};
		nextState = omitPendingRedos( nextState );
		const previousUndoState = nextState.list.pop();
		const updatedUndoState = currentState.cache.reduce(
			appendEditToStack,
			previousUndoState
		);
		nextState.list.push( updatedUndoState );

		return {
			...nextState,
			cache: undefined,
		};
	};

	const appendEditToStack = (
		stack = [],
		{ kind, name, recordId, property, from, to }
	) => {
		const existingEditIndex = stack?.findIndex(
			( { kind: k, name: n, recordId: r, property: p } ) => {
				return (
					k === kind && n === name && r === recordId && p === property
				);
			}
		);
		const nextStack = [ ...stack ];
		if ( existingEditIndex !== -1 ) {
			// If the edit is already in the stack leave the initial "from" value.
			nextStack[ existingEditIndex ] = {
				...nextStack[ existingEditIndex ],
				to,
			};
		} else {
			nextStack.push( {
				kind,
				name,
				recordId,
				property,
				from,
				to,
			} );
		}
		return nextStack;
	};

	switch ( action.type ) {
		case 'CREATE_UNDO_LEVEL':
			return appendCachedEditsToLastUndo( state );

		case 'UNDO':
		case 'REDO': {
			const nextState = appendCachedEditsToLastUndo( state );
			return {
				...nextState,
				offset: state.offset + ( action.type === 'UNDO' ? -1 : 1 ),
			};
		}

		case 'EDIT_ENTITY_RECORD': {
			if ( ! action.meta.undo ) {
				return state;
			}

			const isCachedChange = Object.keys( action.edits ).every(
				( key ) => action.transientEdits[ key ]
			);

			const edits = Object.keys( action.edits ).map( ( key ) => {
				return {
					kind: action.kind,
					name: action.name,
					recordId: action.recordId,
					property: key,
					from: action.meta.undo.edits[ key ],
					to: action.edits[ key ],
				};
			} );

			if ( isCachedChange ) {
				return {
					...state,
					cache: edits.reduce( appendEditToStack, state.cache ),
				};
			}

			let nextState = omitPendingRedos( state );
			nextState = appendCachedEditsToLastUndo( nextState );
			nextState = { ...nextState, list: [ ...nextState.list ] };
			// When an edit is a function it's an optimization to avoid running some expensive operation.
			// We can't rely on the function references being the same so we opt out of comparing them here.
			const comparisonUndoEdits = Object.values(
				action.meta.undo.edits
			).filter( ( edit ) => typeof edit !== 'function' );
			const comparisonEdits = Object.values( action.edits ).filter(
				( edit ) => typeof edit !== 'function'
			);
			if ( ! isShallowEqual( comparisonUndoEdits, comparisonEdits ) ) {
				nextState.list.push( edits );
			}

			return nextState;
		}
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

export function blockPatterns( state = [], action ) {
	switch ( action.type ) {
		case 'RECEIVE_BLOCK_PATTERNS':
			return action.patterns;
	}

	return state;
}

export function blockPatternCategories( state = [], action ) {
	switch ( action.type ) {
		case 'RECEIVE_BLOCK_PATTERN_CATEGORIES':
			return action.categories;
	}

	return state;
}

export function navigationFallbackId( state = null, action ) {
	switch ( action.type ) {
		case 'RECEIVE_NAVIGATION_FALLBACK_ID':
			return action.fallbackId;
	}

	return state;
}

/**
 * Reducer managing the theme global styles revisions.
 *
 * @param {Record<string, object>} state  Current state.
 * @param {Object}                 action Dispatched action.
 *
 * @return {Record<string, object>} Updated state.
 */
export function themeGlobalStyleRevisions( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_THEME_GLOBAL_STYLE_REVISIONS':
			return {
				...state,
				[ action.currentId ]: action.revisions,
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
	themeGlobalStyleVariations,
	themeBaseGlobalStyles,
	themeGlobalStyleRevisions,
	taxonomies,
	entities,
	undo,
	embedPreviews,
	userPermissions,
	autosaves,
	blockPatterns,
	blockPatternCategories,
	navigationFallbackId,
} );
