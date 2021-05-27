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

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';
import { getQueriedItems } from './queried-data';
import { DEFAULT_ENTITY_KEY } from './entities';
import { getNormalizedCommaSeparable } from './utils';
import { CORE_DATA_STORE_NAME as coreDataStoreName } from './utils/constants';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation, as in a connected or
 * other pure component which performs `shouldComponentUpdate` check on props.
 * This should be used as a last resort, since the normalized data should be
 * maintained by the reducer result in state.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

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
		return select( coreDataStoreName ).isResolving(
			STORE_NAME,
			'getEmbedPreview',
			[ url ]
		);
	}
);

/**
 * Returns all available authors.
 *
 * @param {Object}           state Data state.
 * @param {Object|undefined} query Optional object of query parameters to
 *                                 include with request.
 * @return {Array} Authors list.
 */
export function getAuthors( state, query ) {
	const path = addQueryArgs(
		'/wp/v2/users/?who=authors&per_page=100',
		query
	);
	return getUserQueryResults( state, path );
}

/**
 * Returns all available authors.
 *
 * @param {Object} state Data state.
 * @param {number} id The author id.
 *
 * @return {Array} Authors list.
 */
export function __unstableGetAuthor( state, id ) {
	return get( state, [ 'users', 'byId', id ], null );
}

/**
 * Returns the current user.
 *
 * @param {Object} state Data state.
 *
 * @return {Object} Current user object.
 */
export function getCurrentUser( state ) {
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
 * @param {Object} state   Data state.
 * @param {string} kind  Entity kind.
 *
 * @return {Array<Object>} Array of entities with config matching kind.
 */
export function getEntitiesByKind( state, kind ) {
	return filter( state.entities.config, { kind } );
}

/**
 * Returns the entity object given its kind and name.
 *
 * @param {Object} state   Data state.
 * @param {string} kind  Entity kind.
 * @param {string} name  Entity name.
 *
 * @return {Object} Entity
 */
export function getEntity( state, kind, name ) {
	return find( state.entities.config, { kind, name } );
}

/**
 * Returns the Entity's record object by key. Returns `null` if the value is not
 * yet received, undefined if the value entity is known to not exist, or the
 * entity object if it exists and is received.
 *
 * @param {Object}  state State tree
 * @param {string}  kind  Entity kind.
 * @param {string}  name  Entity name.
 * @param {number}  key   Record's key
 * @param {?Object} query Optional query.
 *
 * @return {Object?} Record.
 */
export function getEntityRecord( state, kind, name, key, query ) {
	const queriedState = get( state.entities.data, [
		kind,
		name,
		'queriedData',
	] );
	if ( ! queriedState ) {
		return undefined;
	}

	if ( query === undefined ) {
		// If expecting a complete item, validate that completeness.
		if ( ! queriedState.itemIsComplete[ key ] ) {
			return undefined;
		}

		return queriedState.items[ key ];
	}

	const item = queriedState.items[ key ];
	if ( item && query._fields ) {
		const filteredItem = {};
		const fields = getNormalizedCommaSeparable( query._fields );
		for ( let f = 0; f < fields.length; f++ ) {
			const field = fields[ f ].split( '.' );
			const value = get( item, field );
			set( filteredItem, field, value );
		}
		return filteredItem;
	}

	return item;
}

/**
 * Returns the Entity's record object by key. Doesn't trigger a resolver nor requests the entity from the API if the entity record isn't available in the local state.
 *
 * @param {Object} state  State tree
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {number} key    Record's key
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
 * @param {Object} state  State tree.
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {number} key    Record's key.
 *
 * @return {Object?} Object with the entity's raw attributes.
 */
export const getRawEntityRecord = createSelector(
	( state, kind, name, key ) => {
		const record = getEntityRecord( state, kind, name, key );
		return (
			record &&
			Object.keys( record ).reduce( ( accumulator, _key ) => {
				// Because edits are the "raw" attribute values,
				// we return those from record selectors to make rendering,
				// comparisons, and joins with edits easier.
				accumulator[ _key ] = get(
					record[ _key ],
					'raw',
					record[ _key ]
				);
				return accumulator;
			}, {} )
		);
	},
	( state ) => [ state.entities.data ]
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
export function hasEntityRecords( state, kind, name, query ) {
	return Array.isArray( getEntityRecords( state, kind, name, query ) );
}

/**
 * Returns the Entity's records.
 *
 * @param {Object}  state State tree
 * @param {string}  kind  Entity kind.
 * @param {string}  name  Entity name.
 * @param {?Object} query Optional terms query.
 *
 * @return {?Array} Records.
 */
export function getEntityRecords( state, kind, name, query ) {
	// Queried data state is prepopulated for all known entities. If this is not
	// assigned for the given parameters, then it is known to not exist. Thus, a
	// return value of an empty array is used instead of `null` (where `null` is
	// otherwise used to represent an unknown state).
	const queriedState = get( state.entities.data, [
		kind,
		name,
		'queriedData',
	] );
	if ( ! queriedState ) {
		return EMPTY_ARRAY;
	}
	return getQueriedItems( queriedState, query );
}

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
				).filter( ( primaryKey ) =>
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

		return dirtyRecords;
	},
	( state ) => [ state.entities.data ]
);

/**
 * Returns the specified entity record's edits.
 *
 * @param {Object} state    State tree.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} recordId Record ID.
 *
 * @return {Object?} The entity record's edits.
 */
export function getEntityRecordEdits( state, kind, name, recordId ) {
	return get( state.entities.data, [ kind, name, 'edits', recordId ] );
}

/**
 * Returns the specified entity record's non transient edits.
 *
 * Transient edits don't create an undo level, and
 * are not considered for change detection.
 * They are defined in the entity's config.
 *
 * @param {Object} state    State tree.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} recordId Record ID.
 *
 * @return {Object?} The entity record's non transient edits.
 */
export const getEntityRecordNonTransientEdits = createSelector(
	( state, kind, name, recordId ) => {
		const { transientEdits } = getEntity( state, kind, name ) || {};
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
	( state ) => [ state.entities.config, state.entities.data ]
);

/**
 * Returns true if the specified entity record has edits,
 * and false otherwise.
 *
 * @param {Object} state    State tree.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} recordId Record ID.
 *
 * @return {boolean} Whether the entity record has edits or not.
 */
export function hasEditsForEntityRecord( state, kind, name, recordId ) {
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
 * @param {Object} state    State tree.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} recordId Record ID.
 *
 * @return {Object?} The entity record, merged with its edits.
 */
export const getEditedEntityRecord = createSelector(
	( state, kind, name, recordId ) => ( {
		...getRawEntityRecord( state, kind, name, recordId ),
		...getEntityRecordEdits( state, kind, name, recordId ),
	} ),
	( state ) => [ state.entities.data ]
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
export function isAutosavingEntityRecord( state, kind, name, recordId ) {
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
 * @param {Object} state    State tree.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} recordId Record ID.
 *
 * @return {boolean} Whether the entity record is saving or not.
 */
export function isSavingEntityRecord( state, kind, name, recordId ) {
	return get(
		state.entities.data,
		[ kind, name, 'saving', recordId, 'pending' ],
		false
	);
}

/**
 * Returns true if the specified entity record is deleting, and false otherwise.
 *
 * @param {Object} state    State tree.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} recordId Record ID.
 *
 * @return {boolean} Whether the entity record is deleting or not.
 */
export function isDeletingEntityRecord( state, kind, name, recordId ) {
	return get(
		state.entities.data,
		[ kind, name, 'deleting', recordId, 'pending' ],
		false
	);
}

/**
 * Returns the specified entity record's last save error.
 *
 * @param {Object} state    State tree.
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} recordId Record ID.
 *
 * @return {Object?} The entity record's save error.
 */
export function getLastEntitySaveError( state, kind, name, recordId ) {
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
 * @param {Object} state State tree.
 *
 * @return {number} The current undo offset.
 */
function getCurrentUndoOffset( state ) {
	return state.undo.offset;
}

/**
 * Returns the previous edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param {Object} state State tree.
 *
 * @return {Object?} The edit.
 */
export function getUndoEdit( state ) {
	return state.undo[ state.undo.length - 2 + getCurrentUndoOffset( state ) ];
}

/**
 * Returns the next edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param {Object} state State tree.
 *
 * @return {Object?} The edit.
 */
export function getRedoEdit( state ) {
	return state.undo[ state.undo.length + getCurrentUndoOffset( state ) ];
}

/**
 * Returns true if there is a previous edit from the current undo offset
 * for the entity records edits history, and false otherwise.
 *
 * @param {Object} state State tree.
 *
 * @return {boolean} Whether there is a previous edit or not.
 */
export function hasUndo( state ) {
	return Boolean( getUndoEdit( state ) );
}

/**
 * Returns true if there is a next edit from the current undo offset
 * for the entity records edits history, and false otherwise.
 *
 * @param {Object} state State tree.
 *
 * @return {boolean} Whether there is a next edit or not.
 */
export function hasRedo( state ) {
	return Boolean( getRedoEdit( state ) );
}

/**
 * Return the current theme.
 *
 * @param {Object} state Data state.
 *
 * @return {Object}      The current theme.
 */
export function getCurrentTheme( state ) {
	return state.themes[ state.currentTheme ];
}

/**
 * Return theme supports data in the index.
 *
 * @param {Object} state Data state.
 *
 * @return {*}           Index data.
 */
export function getThemeSupports( state ) {
	return state.themeSupports;
}

/**
 * Returns the embed preview for the given URL.
 *
 * @param {Object} state    Data state.
 * @param {string} url      Embedded URL.
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
 * @param {Object} state    Data state.
 * @param {string} url      Embedded URL.
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
 * @param {Object}   state            Data state.
 * @param {string}   action           Action to check. One of: 'create', 'read', 'update', 'delete'.
 * @param {string}   resource         REST resource to check, e.g. 'media' or 'posts'.
 * @param {string=}  id               Optional ID of the rest resource to check.
 *
 * @return {boolean|undefined} Whether or not the user can perform the action,
 *                             or `undefined` if the OPTIONS request is still being made.
 */
export function canUser( state, action, resource, id ) {
	const key = compact( [ action, resource, id ] ).join( '/' );
	return get( state, [ 'userPermissions', key ] );
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
 * @param {Object} state State tree.
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
