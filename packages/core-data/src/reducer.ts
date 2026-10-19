import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import { compose } from '@wordpress/compose';
import { combineReducers } from '@wordpress/data';
import { createUndoManager } from '@wordpress/undo-manager';
import type {
	ConnectionStatus,
	ConnectionStatusDisconnected,
} from '@wordpress/sync';
import { clearUnchangedEdits, ifMatchingAction, replaceAction } from './utils';
import { reducer as queriedDataReducer } from './queried-data';
import { rootEntitiesConfig, DEFAULT_ENTITY_KEY } from './entities';
import { ConnectionErrorCode } from './sync';
import type * as ET from './entity-types';
import type { EntityActionsConfig, FieldsConfig } from './private-selectors';
import type { ItemId } from './queried-data/types';
import type {
	Action,
	EntitiesState,
	EntityConfig,
	EntityRecordsState,
	KeyedEntityAction,
	UsersState,
} from './types';

/**
 * Reducer managing authors state. Keyed by id.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function users(
	state: UsersState = { byId: {}, queries: {} },
	action: Action
) {
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function currentUser(
	state: ET.User< 'view' > | Record< string, never > = {},
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_CURRENT_USER':
			return action.currentUser;
	}

	return state;
}

/**
 * Reducer managing the current theme.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function currentTheme(
	state: string | undefined = undefined,
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_CURRENT_THEME':
			return action.currentTheme.stylesheet;
	}

	return state;
}

/**
 * Reducer managing the current global styles id.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function currentGlobalStylesId(
	state: number | undefined = undefined,
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_CURRENT_GLOBAL_STYLES_ID':
			return action.id;
	}

	return state;
}

/**
 * Reducer managing the theme base global styles.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function themeBaseGlobalStyles(
	state: Record< string, object > = {},
	action: Action
) {
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function themeGlobalStyleVariations(
	state: Record< string, unknown > = {},
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_THEME_GLOBAL_STYLE_VARIATIONS':
			return {
				...state,
				[ action.stylesheet ]: action.variations,
			};
	}

	return state;
}

const withMultiEntityRecordEdits =
	(
		reducer: (
			state: EntityRecordsState | undefined,
			action: Action
		) => EntityRecordsState
	) =>
	( state: EntityRecordsState | undefined, action: Action ) => {
		if ( action.type === 'UNDO' || action.type === 'REDO' ) {
			const { record } = action;

			let newState = state;
			record.forEach( ( { id, changes } ) => {
				// Entity undo levels are identified by their entity and record.
				const { kind, name, recordId } = id as {
					kind: string;
					name: string;
					recordId: ItemId;
				};
				const persistedRecord =
					state?.queriedData?.items?.default?.[ recordId ];
				const edits = Object.fromEntries(
					Object.entries( changes ).map( ( [ key, value ] ) => [
						key,
						action.type === 'UNDO' ? value.from : value.to,
					] )
				);

				newState = reducer( newState, {
					type: 'EDIT_ENTITY_RECORD',
					kind,
					name,
					recordId,
					// Clear edits matching the persisted record so the entity is
					// no longer dirty after undoing back to its saved state.
					edits: clearUnchangedEdits( edits, persistedRecord ),
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
 * @param entityConfig Entity config.
 *
 * @return Reducer.
 */
function entity( entityConfig: EntityConfig ) {
	// `compose` returns an untyped function, cast to the reducer it builds.
	return compose( [
		withMultiEntityRecordEdits,

		// Limit to matching action type so we don't attempt to replace action on
		// an unhandled action.
		ifMatchingAction(
			( action: { kind?: string; name?: string } ) =>
				action.name &&
				action.kind &&
				action.name === entityConfig.name &&
				action.kind === entityConfig.kind
		),

		// Inject the entity config into the action.
		replaceAction( ( action: Action ): KeyedEntityAction => {
			return {
				key: entityConfig.key || DEFAULT_ENTITY_KEY,
				...action,
			};
		} ),
	] )(
		combineReducers( {
			queriedData: queriedDataReducer,
			edits: (
				state: EntityRecordsState[ 'edits' ] = {},
				action: KeyedEntityAction
			) => {
				switch ( action.type ) {
					case 'RECEIVE_ITEMS':
						const context = action?.query?.context ?? 'default';
						if ( context !== 'default' ) {
							return state;
						}

						const nextState = { ...state };
						const itemsList = Array.isArray( action.items )
							? action.items
							: [ action.items ];

						for ( const record of itemsList ) {
							// Records are keyed by their ID.
							const recordId = record?.[ action.key ] as ItemId;
							const edits = nextState[ recordId ];
							if ( ! edits ) {
								continue;
							}

							const nextEdits = Object.keys( edits ).reduce<
								Record< string, unknown >
							>( ( acc, key ) => {
								// If the edited value is still different to the persisted value,
								// keep the edited value in edits.
								if (
									// Edits are the "raw" attribute values, but records may have
									// objects with more properties, so we use `get` here for the
									// comparison.
									! fastDeepEqual(
										edits[ key ],
										// A raw attribute holds its value under `raw`.
										(
											record[ key ] as
												{ raw?: unknown } | undefined
										 )?.raw ?? record[ key ]
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
							}, {} );

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

			saving: (
				state: EntityRecordsState[ 'saving' ] = {},
				action: KeyedEntityAction
			) => {
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

			deleting: (
				state: EntityRecordsState[ 'deleting' ] = {},
				action: KeyedEntityAction
			) => {
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

			revisions: (
				state: EntityRecordsState[ 'revisions' ] = {},
				action: KeyedEntityAction
			) => {
				// Use the same queriedDataReducer shape for revisions.
				if ( action.type === 'RECEIVE_ITEM_REVISIONS' ) {
					// Revisions are received for a record.
					const recordKey = action.recordKey as ItemId;
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
	) as (
		state: EntityRecordsState | undefined,
		action: Action
	) => EntityRecordsState;
}

/**
 * Reducer keeping track of the registered entities.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function entitiesConfig(
	state: Array< EntityConfig > = rootEntitiesConfig,
	action: Action
) {
	switch ( action.type ) {
		case 'ADD_ENTITIES':
			return [ ...state, ...action.entities ];
	}

	return state;
}

/**
 * Reducer keeping track of the registered entities config and data.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export const entities = (
	state: EntitiesState = {},
	action: Action
): Required< EntitiesState > => {
	const newConfig = entitiesConfig( state.config, action );

	// Generates a reducer for the entities nested by `kind` and `name`.
	// A config array with shape:
	// ```
	// [
	//   { kind: 'taxonomy', name: 'category' },
	//   { kind: 'taxonomy', name: 'post_tag' },
	//   { kind: 'postType', name: 'post' },
	//   { kind: 'postType', name: 'page' },
	// ]
	// ```
	// generates a reducer for state tree with shape:
	// ```
	// {
	//   taxonomy: {
	//     category,
	//     post_tag,
	//   },
	//   postType: {
	//     post,
	//     page,
	//   },
	// }
	// ```
	let entitiesDataReducer = state.reducer;
	if ( ! entitiesDataReducer || newConfig !== state.config ) {
		const entitiesByKind = newConfig.reduce<
			Record< string, Array< EntityConfig > >
		>( ( acc, record ) => {
			const { kind } = record;
			if ( ! acc[ kind ] ) {
				acc[ kind ] = [];
			}
			acc[ kind ].push( record );
			return acc;
		}, {} );

		entitiesDataReducer = combineReducers(
			Object.fromEntries(
				Object.entries( entitiesByKind ).map(
					( [ kind, subEntities ] ) => {
						const kindReducer = combineReducers(
							Object.fromEntries(
								subEntities.map( ( entityConfig ) => [
									entityConfig.name,
									entity( entityConfig ),
								] )
							)
						);

						return [ kind, kindReducer ];
					}
				)
			)
		);
	}

	const newData = entitiesDataReducer( state.records, action );

	if (
		newData === state.records &&
		newConfig === state.config &&
		entitiesDataReducer === state.reducer
	) {
		// Unchanged, so it already holds the reducer, records and config.
		return state as Required< EntitiesState >;
	}

	return {
		reducer: entitiesDataReducer,
		records: newData,
		config: newConfig,
	};
};

export function undoManager( state = createUndoManager() ) {
	return state;
}

// The undo manager above is a mutable object, so changes to it do not change
// state on their own. Entity edits, undo, and redo are store actions already.
// A level the entity sync manager adds to it arrives outside of one, so this
// reference changes then, and selectors reading the undo manager run again.
export function undoManagerReference(
	state: Record< string, never > = {},
	action: Action
) {
	switch ( action.type ) {
		case 'RECORD_SYNC_UNDO_LEVEL':
			return {};
	}
	return state;
}

export function editsReference(
	state: Record< string, never > = {},
	action: Action
) {
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function embedPreviews(
	state: Record< string, unknown > = {},
	action: Action
) {
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function userPermissions(
	state: Record< string, boolean > = {},
	action: Action
) {
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function autosaves(
	state: Record< ItemId, Array< unknown > > = {},
	action: Action
) {
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

export function blockPatterns( state: Array< unknown > = [], action: Action ) {
	switch ( action.type ) {
		case 'RECEIVE_BLOCK_PATTERNS':
			return action.patterns;
	}

	return state;
}

export function blockPatternCategories(
	state: Array< unknown > = [],
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_BLOCK_PATTERN_CATEGORIES':
			return action.categories;
	}

	return state;
}

export function userPatternCategories(
	state: Array< unknown > = [],
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_USER_PATTERN_CATEGORIES':
			return action.patternCategories;
	}
	return state;
}

export function navigationFallbackId(
	state: ItemId | null = null,
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_NAVIGATION_FALLBACK_ID':
			return action.fallbackId;
	}

	return state;
}

/**
 * Reducer managing the theme global styles revisions.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function themeGlobalStyleRevisions(
	state: Record< number, Array< object > > = {},
	action: Action
) {
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function defaultTemplates(
	state: Record< string, string > = {},
	action: Action
) {
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function registeredPostMeta(
	state: Record< string, Record< string, unknown > > = {},
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_REGISTERED_POST_META':
			return {
				...state,
				[ action.postType ]: action.registeredPostMeta,
			};
	}
	return state;
}

/**
 * Reducer managing editor settings.
 *
 * @param state  Current state.
 * @param action Action object.
 *
 * @return Updated state.
 */
export function editorSettings(
	state: Record< string, unknown > | null = null,
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_EDITOR_SETTINGS':
			return action.settings;
	}
	return state;
}

/**
 * Reducer managing editor assets.
 *
 * @param state  Current state.
 * @param action Action object.
 *
 * @return Updated state.
 */
export function editorAssets(
	state: Record< string, unknown > | null = null,
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_EDITOR_ASSETS':
			return action.assets;
	}
	return state;
}

/**
 * Reducer managing sync connection states for entities.
 * Keyed by "kind/name:id" (e.g., "postType/post:123").
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function syncConnectionStatuses(
	state: Record< string, ConnectionStatus > = {},
	action: Action
) {
	switch ( action.type ) {
		case 'SET_SYNC_CONNECTION_STATUS': {
			const key = `${ action.kind }/${ action.name }:${ action.key }`;
			return {
				...state,
				[ key ]: action.status,
			};
		}
		case 'CLEAR_SYNC_CONNECTION_STATUS': {
			const key = `${ action.kind }/${ action.name }:${ action.key }`;
			const { [ key ]: _, ...rest } = state;
			return rest;
		}
	}
	return state;
}

/**
 * Reducer managing whether collaboration is supported.
 *
 * Default to true, as collaboration is supported by default
 * unless explicitly disabled due to unsupported conditions
 * such as metaboxes.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function collaborationSupported( state = true, action: Action ) {
	switch ( action.type ) {
		case 'SET_COLLABORATION_SUPPORTED':
			return action.supported;

		case 'SET_SYNC_CONNECTION_STATUS':
			if (
				ConnectionErrorCode.DOCUMENT_SIZE_LIMIT_EXCEEDED ===
				// Only a disconnected status has an error.
				( action.status as ConnectionStatusDisconnected )?.error?.code
			) {
				return false;
			}

			return state;
	}
	return state;
}

/**
 * Reducer managing view configs, keyed by `kind/name`.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function viewConfigs(
	state: Record< string, Record< string, unknown > > = {},
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_VIEW_CONFIG': {
			const key = `${ action.kind }/${ action.name }`;
			// Merge so a partial (`_fields`) response doesn't clobber
			// properties already received for the same entity.
			return {
				...state,
				[ key ]: {
					...state[ key ],
					...action.config,
				},
			};
		}
	}
	return state;
}

/**
 * Reducer managing the fields configs, keyed by kind, then name.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function fieldsConfigs(
	state: Record< string, Record< string, FieldsConfig > > = {},
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_FIELDS_CONFIG':
			return {
				...state,
				[ action.kind ]: {
					...state[ action.kind ],
					[ action.name ]: action.config,
				},
			};
	}
	return state;
}

/**
 * Reducer managing the actions configs, keyed by kind, then name.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function entityActionsConfigs(
	state: Record< string, Record< string, EntityActionsConfig > > = {},
	action: Action
) {
	switch ( action.type ) {
		case 'RECEIVE_ENTITY_ACTIONS_CONFIG':
			return {
				...state,
				[ action.kind ]: {
					...state[ action.kind ],
					[ action.name ]: action.config,
				},
			};
	}
	return state;
}

export default combineReducers( {
	users,
	currentTheme,
	currentGlobalStylesId,
	currentUser,
	themeGlobalStyleVariations,
	themeBaseGlobalStyles,
	themeGlobalStyleRevisions,
	entities,
	editsReference,
	undoManagerReference,
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
	editorSettings,
	editorAssets,
	syncConnectionStatuses,
	collaborationSupported,
	viewConfigs,
	fieldsConfigs,
	entityActionsConfigs,
} );
