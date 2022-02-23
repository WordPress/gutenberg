/**
 * External dependencies
 */
import createSelector from 'rememo';
import { set, map, find, get, filter, compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';
import { getQueriedItems } from './queried-data';
import {
	DEFAULT_ENTITY_KEY,
	DefaultEntityContext,
	EntityRecordByKindName,
	Kind,
	Name,
	EntityQuery,
	EntityKeyType,
	EntityDetails,
	UpdatableEntityRecordByKindName,
	EntityDefinition,
	EntityDetailsLookup,
} from './entities';
import { getNormalizedCommaSeparable, isRawAttribute } from './utils';
import { Context, Updatable } from './types';

// createSelector isn't properly typed if I don't explicitly import these files – ideally they would
// be merely ambient definitions that TS is aware of.
import type {} from './rememo';
import type {} from './wordpress-data';

// Bogus definition for the development
type State = any;

/**
 * Shared reference to an empty object for cases where it is important to avoid
 * returning a new object reference on every invocation, as in a connected or
 * other pure component which performs `shouldComponentUpdate` check on props.
 * This should be used as a last resort, since the normalized data should be
 * maintained by the reducer result in state.
 */
const EMPTY_OBJECT = {};

/**
 * Returns true if a request is in progress for embed preview data, or false
 * otherwise.
 *
 * @param {Object} state Data state.
 * @param {string} url   URL the preview would be for.
 *
 * @return {boolean} Whether a request is in progress for an embed preview.
 */
export const isRequestingEmbedPreview = createRegistrySelector(
	( select ) => ( state, url ) => {
		return select( STORE_NAME ).isResolving( 'getEmbedPreview', [ url ] );
	}
);

/**
 * Returns all available authors.
 *
 * @deprecated since 11.3. Callers should use `select( 'core' ).getUsers({ who: 'authors' })` instead.
 *
 * @param {Object}           state Data state.
 * @param {Object|undefined} query Optional object of query parameters to
 *                                 include with request.
 * @return {Array} Authors list.
 */
export function getAuthors( state, query ) {
	deprecated( "select( 'core' ).getAuthors()", {
		since: '5.9',
		alternative: "select( 'core' ).getUsers({ who: 'authors' })",
	} );

	const path = addQueryArgs(
		'/wp/v2/users/?who=authors&per_page=100',
		query
	);
	return getUserQueryResults( state, path );
}

/**
 * Returns the current user.
 *
 * @param {Object} state Data state.
 *
 * @return {Object} Current user object.
 */
export function getCurrentUser( state: State ) {
	return state.currentUser;
}

/**
 * Returns all the users returned by a query ID.
 *
 * @param {Object} state   Data state.
 * @param {string} queryID Query ID.
 *
 * @return {Array} Users list.
 */
export const getUserQueryResults = createSelector(
	( state, queryID ) => {
		const queryResults = state.users.queries[ queryID ];

		return map( queryResults, ( id ) => state.users.byId[ id ] );
	},
	( state, queryID ) => [ state.users.queries[ queryID ], state.users.byId ]
);

/**
 * Returns whether the entities for the give kind are loaded.
 *
 * @param  state Data state.
 * @param  kind  Entity kind.
 *
 * @return Array of entities with config matching kind.
 */
export function getEntitiesByKind< K extends Kind >(
	state: State,
	kind: K
): Array<
	| ( K extends keyof EntityDetailsLookup
			? EntityDetailsLookup[ K ]
			: EntityDefinition )
	| EntityDefinition
> {
	return filter( state.entities.config, { kind } );
}

/**
 * Returns the entity object given its kind and name.
 *
 * @param  state Data state.
 * @param  kind  Entity kind.
 * @param  name  Entity name.
 *
 * @return Entity
 */
export function getEntity< K extends Kind, N extends Name< K > >(
	state: State,
	kind: K,
	name: N
): EntityDetails< K, N > extends unknown
	? EntityDefinition | null
	: EntityDetails< K, N > {
	return find( state.entities.config, { kind, name } );
}

/**
 * Returns the Entity's record object by key. Returns `null` if the value is not
 * yet received, undefined if the value entity is known to not exist, or the
 * entity object if it exists and is received.
 *
 * @param  state State tree
 * @param  kind  Entity kind.
 * @param  name  Entity name.
 * @param  key   Record's key
 * @param  query Optional query.
 *
 * @return Record.
 */
export const getEntityRecord = createSelector(
	function <
		K extends Kind,
		N extends Name< K >,
		Key extends EntityKeyType< K, N >,
		C extends Context = DefaultEntityContext< K, N >
	>(
		state: State,
		kind: K,
		name: N,
		key: Key,
		query?: EntityQuery< C >
	): EntityRecordByKindName< K, N, C > | null {
		const queriedState = get( state.entities.data, [
			kind,
			name,
			'queriedData',
		] );
		if ( ! queriedState ) {
			return undefined;
		}
		const context = query?.context ?? 'default';

		if ( query === undefined ) {
			// If expecting a complete item, validate that completeness.
			if ( ! queriedState.itemIsComplete[ context ]?.[ key ] ) {
				return undefined;
			}

			return queriedState.items[ context ][ key ];
		}

		const item = queriedState.items[ context ]?.[ key ];
		if ( item && query._fields ) {
			const filteredItem = {};
			const fields = getNormalizedCommaSeparable( query._fields );
			for ( let f = 0; f < fields.length; f++ ) {
				const field = fields[ f ].split( '.' );
				const value = get( item, field );
				set( filteredItem, field, value );
			}
			return filteredItem as EntityRecordByKindName< K, N, C >;
		}

		return item;
	},
	( state, kind, name, recordId, query ) => {
		const context = query?.context ?? 'default';
		return [
			get( state.entities.data, [
				kind,
				name,
				'queriedData',
				'items',
				context,
				recordId,
			] ),
			get( state.entities.data, [
				kind,
				name,
				'queriedData',
				'itemIsComplete',
				context,
				recordId,
			] ),
		];
	}
);

/**
 * Returns the Entity's record object by key. Doesn't trigger a resolver nor requests the entity from the API if the entity record isn't available in the local state.
 *
 * @param {Object} state State tree
 * @param {string} kind  Entity kind.
 * @param {string} name  Entity name.
 * @param {number} key   Record's key
 *
 * @return {Object|null} Record.
 */
export function __experimentalGetEntityRecordNoResolver(
	state,
	kind,
	name,
	key
) {
	return getEntityRecord( state, kind, name, key );
}

/**
 * Returns the entity's record object by key,
 * with its attributes mapped to their raw values.
 *
 * @param {Object} state State tree.
 * @param {string} kind  Entity kind.
 * @param {string} name  Entity name.
 * @param {number} key   Record's key.
 *
 * @return {Object?} Object with the entity's raw attributes.
 */
export const getRawEntityRecord = createSelector(
	( state, kind, name, key ) => {
		const record = getEntityRecord( state, kind, name, key );
		return (
			record &&
			Object.keys( record ).reduce( ( accumulator, _key ) => {
				if ( isRawAttribute( getEntity( state, kind, name ), _key ) ) {
					// Because edits are the "raw" attribute values,
					// we return those from record selectors to make rendering,
					// comparisons, and joins with edits easier.
					accumulator[ _key ] = get(
						record[ _key ],
						'raw',
						record[ _key ]
					);
				} else {
					accumulator[ _key ] = record[ _key ];
				}
				return accumulator;
			}, {} )
		);
	},
	( state, kind, name, recordId, query ) => {
		const context = query?.context ?? 'default';
		return [
			state.entities.config,
			get( state.entities.data, [
				kind,
				name,
				'queriedData',
				'items',
				context,
				recordId,
			] ),
			get( state.entities.data, [
				kind,
				name,
				'queriedData',
				'itemIsComplete',
				context,
				recordId,
			] ),
		];
	}
);

/**
 * Returns true if records have been received for the given set of parameters,
 * or false otherwise.
 *
 * @param {Object}  state State tree
 * @param {string}  kind  Entity kind.
 * @param {string}  name  Entity name.
 * @param {?Object} query Optional terms query.
 *
 * @return {boolean} Whether entity records have been received.
 */
export function hasEntityRecords<
	K extends Kind,
	N extends Name< K >,
	C extends Context = DefaultEntityContext< K, N >
>( state: State, kind: K, name: N, query?: EntityQuery< C > ): boolean {
	return Array.isArray( getEntityRecords( state, kind, name, query ) );
}

/**
 * Returns the Entity's records.
 *
 * @param  state State tree
 * @param  kind  Entity kind.
 * @param  name  Entity name.
 * @param  query Optional terms query.
 *
 * @return  Records.
 */
export const getEntityRecords = createSelector( function <
	K extends Kind,
	N extends Name< K >,
	C extends Context = DefaultEntityContext< K, N >
>(
	state: State,
	kind: K,
	name: N,
	query?: EntityQuery< C >
): Array< EntityRecordByKindName< K, N, C > > | null {
	// Queried data state is prepopulated for all known entities. If this is not
	// assigned for the given parameters, then it is known to not exist.
	const queriedState = get( state.entities.data, [
		kind,
		name,
		'queriedData',
	] );
	if ( ! queriedState ) {
		return null;
	}
	return getQueriedItems( queriedState, query );
} );

const s = getEntityRecords( {}, 'root', 'site' )[ 0 ];
// s is Settings<'view'>
const a = getEntityRecords( {}, 'root', 'plugin' )[ 0 ];
// a is Plugin<'edit'>
const b = getEntityRecords( {}, 'root', 'plugin', { context: 'embed' } )[ 0 ];
// b is Plugin<'embed'>
const c = getEntityRecords( {}, 'postType', 'post', { context: 'embed' } )[ 0 ];
// c is Post<'embed'>
const d = getEntityRecords( {}, 'postType', 'post' )[ 0 ];
// d is Post<'edit'>

/**
 * Returns the  list of dirty entity records.
 *
 * @param {Object} state State tree.
 *
 * @return {[{ title: string, key: string, name: string, kind: string }]} The list of updated records
 */
export const __experimentalGetDirtyEntityRecords = createSelector(
	( state ) => {
		const {
			entities: { data },
		} = state;
		const dirtyRecords = [];
		Object.keys( data ).forEach( ( kind ) => {
			Object.keys( data[ kind ] ).forEach( ( name ) => {
				const primaryKeys = Object.keys(
					data[ kind ][ name ].edits
				).filter(
					( primaryKey ) =>
						// The entity record must exist (not be deleted),
						// and it must have edits.
						getEntityRecord( state, kind, name, primaryKey ) &&
						hasEditsForEntityRecord( state, kind, name, primaryKey )
				);

				if ( primaryKeys.length ) {
					const entity = getEntity( state, kind, name );
					primaryKeys.forEach( ( primaryKey ) => {
						const entityRecord = getEditedEntityRecord(
							state,
							kind,
							name,
							primaryKey
						);
						dirtyRecords.push( {
							// We avoid using primaryKey because it's transformed into a string
							// when it's used as an object key.
							key:
								entityRecord[
									'key' in entity && entity.key
										? entity.key
										: DEFAULT_ENTITY_KEY
								],
							title: entity?.getTitle?.( entityRecord ) || '',
							name,
							kind,
						} );
					} );
				}
			} );
		} );

		return dirtyRecords;
	},
	( state ) => [ state.entities.data ]
);

/**
 * Returns the list of entities currently being saved.
 *
 * @param {Object} state State tree.
 *
 * @return {[{ title: string, key: string, name: string, kind: string }]} The list of records being saved.
 */
export const __experimentalGetEntitiesBeingSaved = createSelector(
	( state ) => {
		const {
			entities: { data },
		} = state;
		const recordsBeingSaved = [];
		Object.keys( data ).forEach( ( kind ) => {
			Object.keys( data[ kind ] ).forEach( ( name ) => {
				const primaryKeys = Object.keys(
					data[ kind ][ name ].saving
				).filter( ( primaryKey ) =>
					isSavingEntityRecord( state, kind, name, primaryKey )
				);

				if ( primaryKeys.length ) {
					const entity = getEntity( state, kind, name );
					primaryKeys.forEach( ( primaryKey ) => {
						const entityRecord = getEditedEntityRecord(
							state,
							kind,
							name,
							primaryKey
						);
						recordsBeingSaved.push( {
							// We avoid using primaryKey because it's transformed into a string
							// when it's used as an object key.
							key:
								entityRecord[
									entity.key || DEFAULT_ENTITY_KEY
								],
							title: entity?.getTitle?.( entityRecord ) || '',
							name,
							kind,
						} );
					} );
				}
			} );
		} );
		return recordsBeingSaved;
	},
	( state ) => [ state.entities.data ]
);

/**
 * Returns the specified entity record's edits.
 *
 * @param  state    State tree.
 * @param  kind     Entity kind.
 * @param  name     Entity name.
 * @param  recordId Record ID.
 *
 * @return The entity record's edits.
 */
export function getEntityRecordEdits< K extends Kind, N extends Name< K > >(
	state: State,
	kind: K,
	name: N,
	recordId: EntityKeyType< K, N >
): Partial< UpdatableEntityRecordByKindName< K, N > > {
	return get( state.entities.data, [ kind, name, 'edits', recordId ] );
}

/**
 * Returns the specified entity record's non transient edits.
 *
 * Transient edits don't create an undo level, and
 * are not considered for change detection.
 * They are defined in the entity's config.
 *
 * @param  state    State tree.
 * @param  kind     Entity kind.
 * @param  name     Entity name.
 * @param  recordId Record ID.
 *
 * @return The entity record's non transient edits.
 */
export const getEntityRecordNonTransientEdits = createSelector(
	function < K extends Kind, N extends Name< K > >(
		state: State,
		kind: K,
		name: N,
		recordId: EntityKeyType< K, N >
	): Partial< UpdatableEntityRecordByKindName< K, N > > {
		const entity = getEntity( state, kind, name );
		const transientEdits = ( entity as any ).transientEdit; // @FIXME
		const edits = getEntityRecordEdits( state, kind, name, recordId ) || {};
		if ( ! transientEdits ) {
			return edits;
		}
		return Object.keys( edits ).reduce( ( acc, key ) => {
			if ( ! transientEdits[ key ] ) {
				acc[ key ] = edits[ key ];
			}
			return acc;
		}, {} );
	},
	( state, kind, name, recordId ) => [
		state.entities.config,
		get( state.entities.data, [ kind, name, 'edits', recordId ] ),
	]
);

/**
 * Returns true if the specified entity record has edits,
 * and false otherwise.
 *
 * @param  state    State tree.
 * @param  kind     Entity kind.
 * @param  name     Entity name.
 * @param  recordId Record ID.
 *
 * @return Whether the entity record has edits or not.
 */
export function hasEditsForEntityRecord< K extends Kind, N extends Name< K > >(
	state: State,
	kind: K,
	name: N,
	recordId: EntityKeyType< K, N >
): boolean {
	return (
		isSavingEntityRecord( state, kind, name, recordId ) ||
		Object.keys(
			getEntityRecordNonTransientEdits( state, kind, name, recordId )
		).length > 0
	);
}

/**
 * Returns the specified entity record, merged with its edits.
 *
 * @param  state    State tree.
 * @param  kind     Entity kind.
 * @param  name     Entity name.
 * @param  recordId Record ID.
 *
 * @return The entity record, merged with its edits.
 */
export const getEditedEntityRecord = createSelector(
	function <
		K extends Kind,
		N extends Name< K >,
		Key extends EntityKeyType< K, N >
	>(
		state: State,
		kind: K,
		name: N,
		recordId: Key
	): UpdatableEntityRecordByKindName< K, N > {
		return {
			...getRawEntityRecord( state, kind, name, recordId ),
			...getEntityRecordEdits( state, kind, name, recordId ),
		} as UpdatableEntityRecordByKindName< K, N >;
	},
	( state, kind, name, recordId, query ) => {
		const context = query?.context ?? 'default';
		return [
			state.entities.config,
			get( state.entities.data, [
				kind,
				name,
				'queriedData',
				'items',
				context,
				recordId,
			] ),
			get( state.entities.data, [
				kind,
				name,
				'queriedData',
				'itemIsComplete',
				context,
				recordId,
			] ),
			get( state.entities.data, [ kind, name, 'edits', recordId ] ),
		];
	}
);

/**
 * Returns true if the specified entity record is autosaving, and false otherwise.
 *
 * @param {Object} state    State tree.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} recordId Record ID.
 *
 * @return {boolean} Whether the entity record is autosaving or not.
 */
export function isAutosavingEntityRecord<
	K extends Kind,
	N extends Name< K >,
	Key extends EntityKeyType< K, N >
>( state: State, kind: K, name: N, recordId: Key ): boolean {
	const { pending, isAutosave } = get(
		state.entities.data,
		[ kind, name, 'saving', recordId ],
		{}
	);
	return Boolean( pending && isAutosave );
}

/**
 * Returns true if the specified entity record is saving, and false otherwise.
 *
 * @param  state    State tree.
 * @param  kind     Entity kind.
 * @param  name     Entity name.
 * @param  recordId Record ID.
 *
 * @return Whether the entity record is saving or not.
 */
export function isSavingEntityRecord<
	K extends Kind,
	N extends Name< K >,
	Key extends EntityKeyType< K, N >
>( state: State, kind: K, name: N, recordId: Key ): boolean {
	return get(
		state.entities.data,
		[ kind, name, 'saving', recordId, 'pending' ],
		false
	);
}

/**
 * Returns true if the specified entity record is deleting, and false otherwise.
 *
 * @param  state    State tree.
 * @param  kind     Entity kind.
 * @param  name     Entity name.
 * @param  recordId Record ID.
 *
 * @return Whether the entity record is deleting or not.
 */
export function isDeletingEntityRecord<
	K extends Kind,
	N extends Name< K >,
	Key extends EntityKeyType< K, N >
>( state: State, kind: K, name: N, recordId: Key ): boolean {
	return get(
		state.entities.data,
		[ kind, name, 'deleting', recordId, 'pending' ],
		false
	);
}

/**
 * Returns the specified entity record's last save error.
 *
 * @param  state    State tree.
 * @param  kind     Entity kind.
 * @param  name     Entity name.
 * @param  recordId Record ID.
 *
 * @return The entity record's save error.
 */
export function getLastEntitySaveError<
	K extends Kind,
	N extends Name< K >,
	Key extends EntityKeyType< K, N >
>(
	state: State,
	kind: K,
	name: N,
	recordId: Key
): Record< string, string > | null {
	return get( state.entities.data, [
		kind,
		name,
		'saving',
		recordId,
		'error',
	] );
}

/**
 * Returns the specified entity record's last delete error.
 *
 * @param {Object} state    State tree.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} recordId Record ID.
 *
 * @return {Object?} The entity record's save error.
 */
export function getLastEntityDeleteError( state, kind, name, recordId ) {
	return get( state.entities.data, [
		kind,
		name,
		'deleting',
		recordId,
		'error',
	] );
}

/**
 * Returns the current undo offset for the
 * entity records edits history. The offset
 * represents how many items from the end
 * of the history stack we are at. 0 is the
 * last edit, -1 is the second last, and so on.
 *
 * @param  state State tree.
 *
 * @return The current undo offset.
 */
function getCurrentUndoOffset( state: State ): number {
	return state.undo.offset;
}

/**
 * Returns the previous edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param  state State tree.
 *
 * @return The edit.
 */
export function getUndoEdit( state: State ): Record< string, any > | null {
	return state.undo[ state.undo.length - 2 + getCurrentUndoOffset( state ) ];
}

/**
 * Returns the next edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param  state State tree.
 *
 * @return The edit.
 */
export function getRedoEdit( state: State ): Record< string, any > | null {
	return state.undo[ state.undo.length + getCurrentUndoOffset( state ) ];
}

/**
 * Returns true if there is a previous edit from the current undo offset
 * for the entity records edits history, and false otherwise.
 *
 * @param  state State tree.
 *
 * @return Whether there is a previous edit or not.
 */
export function hasUndo( state: State ): boolean {
	return Boolean( getUndoEdit( state ) );
}

/**
 * Returns true if there is a next edit from the current undo offset
 * for the entity records edits history, and false otherwise.
 *
 * @param  state State tree.
 *
 * @return Whether there is a next edit or not.
 */
export function hasRedo( state: State ): boolean {
	return Boolean( getRedoEdit( state ) );
}

/**
 * Return the current theme.
 *
 * @param {Object} state Data state.
 *
 * @return {Object} The current theme.
 */
export function getCurrentTheme( state: State ) {
	return getEntityRecord( state, 'root', 'theme', state.currentTheme );
}

/**
 * Return the ID of the current global styles object.
 *
 * @param {Object} state Data state.
 *
 * @return {string} The current global styles ID.
 */
export function __experimentalGetCurrentGlobalStylesId( state: State ) {
	return state.currentGlobalStylesId;
}

/**
 * Return theme supports data in the index.
 *
 * @param {Object} state Data state.
 *
 * @return {*} Index data.
 */
export function getThemeSupports( state: State ) {
	return getCurrentTheme( state )?.theme_supports ?? EMPTY_OBJECT;
}

/**
 * Returns the embed preview for the given URL.
 *
 * @param {Object} state Data state.
 * @param {string} url   Embedded URL.
 *
 * @return {*} Undefined if the preview has not been fetched, otherwise, the preview fetched from the embed preview API.
 */
export function getEmbedPreview( state, url ) {
	return state.embedPreviews[ url ];
}

/**
 * Determines if the returned preview is an oEmbed link fallback.
 *
 * WordPress can be configured to return a simple link to a URL if it is not embeddable.
 * We need to be able to determine if a URL is embeddable or not, based on what we
 * get back from the oEmbed preview API.
 *
 * @param {Object} state Data state.
 * @param {string} url   Embedded URL.
 *
 * @return {boolean} Is the preview for the URL an oEmbed link fallback.
 */
export function isPreviewEmbedFallback( state, url ) {
	const preview = state.embedPreviews[ url ];
	const oEmbedLinkCheck = '<a href="' + url + '">' + url + '</a>';
	if ( ! preview ) {
		return false;
	}
	return preview.html === oEmbedLinkCheck;
}

/**
 * Returns whether the current user can perform the given action on the given
 * REST resource.
 *
 * Calling this may trigger an OPTIONS request to the REST API via the
 * `canUser()` resolver.
 *
 * https://developer.wordpress.org/rest-api/reference/
 *
 * @param {Object}  state    Data state.
 * @param {string}  action   Action to check. One of: 'create', 'read', 'update', 'delete'.
 * @param {string}  resource REST resource to check, e.g. 'media' or 'posts'.
 * @param {string=} id       Optional ID of the rest resource to check.
 *
 * @return {boolean|undefined} Whether or not the user can perform the action,
 *                             or `undefined` if the OPTIONS request is still being made.
 */
export function canUser( state, action, resource, id ) {
	const key = compact( [ action, resource, id ] ).join( '/' );
	return get( state, [ 'userPermissions', key ] );
}

/**
 * Returns whether the current user can edit the given entity.
 *
 * Calling this may trigger an OPTIONS request to the REST API via the
 * `canUser()` resolver.
 *
 * https://developer.wordpress.org/rest-api/reference/
 *
 * @param {Object} state    Data state.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {string} recordId Record's id.
 * @return {boolean|undefined} Whether or not the user can edit,
 * or `undefined` if the OPTIONS request is still being made.
 */
export function canUserEditEntityRecord( state, kind, name, recordId ) {
	const entity = getEntity( state, kind, name );
	if ( ! entity ) {
		return false;
	}
	const resource = ( entity as any ).__unstable_rest_base;

	return canUser( state, 'update', resource, recordId );
}

/**
 * Returns the latest autosaves for the post.
 *
 * May return multiple autosaves since the backend stores one autosave per
 * author for each post.
 *
 * @param {Object} state    State tree.
 * @param {string} postType The type of the parent post.
 * @param {number} postId   The id of the parent post.
 *
 * @return {?Array} An array of autosaves for the post, or undefined if there is none.
 */
export function getAutosaves( state, postType, postId ) {
	return state.autosaves[ postId ];
}

/**
 * Returns the autosave for the post and author.
 *
 * @param {Object} state    State tree.
 * @param {string} postType The type of the parent post.
 * @param {number} postId   The id of the parent post.
 * @param {number} authorId The id of the author.
 *
 * @return {?Object} The autosave for the post and author.
 */
export function getAutosave( state, postType, postId, authorId ) {
	if ( authorId === undefined ) {
		return;
	}

	const autosaves = state.autosaves[ postId ];
	return find( autosaves, { author: authorId } );
}

/**
 * Returns true if the REST request for autosaves has completed.
 *
 * @param {Object} state    State tree.
 * @param {string} postType The type of the parent post.
 * @param {number} postId   The id of the parent post.
 *
 * @return {boolean} True if the REST request was completed. False otherwise.
 */
export const hasFetchedAutosaves = createRegistrySelector(
	( select ) => ( state, postType, postId ) => {
		return select( STORE_NAME ).hasFinishedResolution( 'getAutosaves', [
			postType,
			postId,
		] );
	}
);

/**
 * Returns a new reference when edited values have changed. This is useful in
 * inferring where an edit has been made between states by comparison of the
 * return values using strict equality.
 *
 * @example
 *
 * ```
 * const hasEditOccurred = (
 *    getReferenceByDistinctEdits( beforeState ) !==
 *    getReferenceByDistinctEdits( afterState )
 * );
 * ```
 *
 * @param {Object} state Editor state.
 *
 * @return {*} A value whose reference will change only when an edit occurs.
 */
export const getReferenceByDistinctEdits = createSelector(
	() => [],
	( state ) => [
		state.undo.length,
		state.undo.offset,
		state.undo.flattenedUndo,
	]
);

/**
 * Retrieve the frontend template used for a given link.
 *
 * @param {Object} state Editor state.
 * @param {string} link  Link.
 *
 * @return {Object?} The template record.
 */
export function __experimentalGetTemplateForLink( state, link ) {
	const records = getEntityRecords( state, 'postType', 'wp_template', {
		'find-template': link,
	} );

	const template = records?.length ? records[ 0 ] : null;
	if ( template ) {
		return getEditedEntityRecord(
			state,
			'postType',
			'wp_template',
			template.id
		);
	}
	return template;
}

/**
 * Retrieve the current theme's base global styles
 *
 * @param {Object} state Editor state.
 *
 * @return {Object?} The Global Styles object.
 */
export function __experimentalGetCurrentThemeBaseGlobalStyles( state: State ) {
	const currentTheme = getCurrentTheme( state );
	if ( ! currentTheme ) {
		return null;
	}
	return state.themeBaseGlobalStyles[ currentTheme.stylesheet ];
}

/**
 * Return the ID of the current global styles object.
 *
 * @param {Object} state Data state.
 *
 * @return {string} The current global styles ID.
 */
export function __experimentalGetCurrentThemeGlobalStylesVariations(
	state: State
) {
	const currentTheme = getCurrentTheme( state );
	if ( ! currentTheme ) {
		return null;
	}
	return state.themeGlobalStyleVariations[ currentTheme.stylesheet ];
}
