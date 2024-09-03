/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { combineReducers } from '@wordpress/data';
import { createUndoManager } from '@wordpress/undo-manager';

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
		const { record } = action;

		let newState = state;
		record.forEach( ( { id: { kind, name, recordId }, changes } ) => {
			newState = reducer( newState, {
				type: 'EDIT_ENTITY_RECORD',
				kind,
				name,
				recordId,
				edits: Object.entries( changes ).reduce(
					( acc, [ key, value ] ) => {
						acc[ key ] =
							action.type === 'UNDO' ? value.from : value.to;
						return acc;
					},
					{}
				),
			} );
		} );
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
				key: entityConfig.key || DEFAULT_ENTITY_KEY,
				...action,
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
							const recordId = record?.[ action.key ];
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

			revisions: ( state = {}, action ) => {
				// Use the same queriedDataReducer shape for revisions.
				if ( action.type === 'RECEIVE_ITEM_REVISIONS' ) {
					const recordKey = action.recordKey;
					delete action.recordKey;
					const newState = queriedDataReducer( state[ recordKey ], {
						...action,
						type: 'RECEIVE_ITEMS',
					} );
					return {
						...state,
						[ recordKey ]: newState,
					};
				}

				if ( action.type === 'REMOVE_ITEMS' ) {
					return Object.fromEntries(
						Object.entries( state ).filter(
							( [ id ] ) =>
								! action.itemIds.some( ( itemId ) => {
									if ( Number.isInteger( itemId ) ) {
										return itemId === +id;
									}
									return itemId === id;
								} )
						)
					);
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
 * @type {UndoManager}
 */
export function undoManager( state = createUndoManager() ) {
	return state;
}

export function editsReference( state = {}, action ) {
	switch ( action.type ) {
		case 'EDIT_ENTITY_RECORD':
		case 'UNDO':
		case 'REDO':
			return {};
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
		case 'RECEIVE_USER_PERMISSIONS':
			return {
				...state,
				...action.permissions,
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

export function userPatternCategories( state = [], action ) {
	switch ( action.type ) {
		case 'RECEIVE_USER_PATTERN_CATEGORIES':
			return action.patternCategories;
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

/**
 * Reducer managing the template lookup per query.
 *
 * @param {Record<string, string>} state  Current state.
 * @param {Object}                 action Dispatched action.
 *
 * @return {Record<string, string>} Updated state.
 */
export function defaultTemplates( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_DEFAULT_TEMPLATE':
			return {
				...state,
				[ JSON.stringify( action.query ) ]: action.templateId,
			};
	}

	return state;
}

/**
 * Reducer returning an object of registered post meta.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function registeredPostMeta( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_REGISTERED_POST_META':
			return {
				...state,
				[ action.postType ]: action.registeredPostMeta,
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
	editsReference,
	undoManager,
	embedPreviews,
	userPermissions,
	autosaves,
	blockPatterns,
	blockPatternCategories,
	userPatternCategories,
	navigationFallbackId,
	defaultTemplates,
	registeredPostMeta,
} );
