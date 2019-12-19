/**
 * External dependencies
 */
import createSelector from 'rememo';
import { map, find, get, filter, compact, defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { REDUCER_KEY } from './name';
import { getQueriedItems } from './queried-data';

/**
 * Returns true if a request is in progress for embed preview data, or false
 * otherwise.
 *
 * @param {Object} state Data state.
 * @param {string} url   URL the preview would be for.
 *
 * @return {boolean} Whether a request is in progress for an embed preview.
 */
export const isRequestingEmbedPreview = createRegistrySelector( ( select ) => ( state, url ) => {
	return select( 'core/data' ).isResolving( REDUCER_KEY, 'getEmbedPreview', [ url ] );
} );

/**
 * Returns all available authors.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Authors list.
 */
export function getAuthors( state ) {
	return getUserQueryResults( state, 'authors' );
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
 * @return {boolean} Whether the entities are loaded
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
 * Returns the Entity's record object by key.
 *
 * @param {Object} state  State tree
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {number} key    Record's key
 *
 * @return {Object?} Record.
 */
export function getEntityRecord( state, kind, name, key ) {
	return get( state.entities.data, [ kind, name, 'queriedData', 'items', key ] );
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
								accumulator[ _key ] = get( record[ _key ], 'raw', record[ _key ] );
								return accumulator;
							}, {} )
		);
	},
	( state ) => [ state.entities.data ]
);

/**
 * Returns the Entity's records.
 *
 * @param {Object}  state  State tree
 * @param {string}  kind   Entity kind.
 * @param {string}  name   Entity name.
 * @param {?Object} query  Optional terms query.
 *
 * @return {Array} Records.
 */
export function getEntityRecords( state, kind, name, query ) {
	const queriedState = get( state.entities.data, [ kind, name, 'queriedData' ] );
	if ( ! queriedState ) {
		return [];
	}
	return getQueriedItems( queriedState, query );
}

/**
 * Returns a map of objects with each edited
 * raw entity record and its corresponding edits.
 *
 * The map is keyed by entity `kind => name => key => { rawRecord, edits }`.
 *
 * @param {Object} state State tree.
 *
 * @return {{ [kind: string]: { [name: string]: { [key: string]: { rawRecord: Object<string,*>, edits: Object<string,*> } } } }} The map of edited records with their edits.
 */
export const getEntityRecordChangesByRecord = createSelector(
	( state ) => {
		const {
			entities: { data },
		} = state;
		return Object.keys( data ).reduce( ( acc, kind ) => {
			Object.keys( data[ kind ] ).forEach( ( name ) => {
				const editsKeys = Object.keys( data[ kind ][ name ].edits ).filter( ( editsKey ) =>
					hasEditsForEntityRecord( state, kind, name, editsKey )
				);
				if ( editsKeys.length ) {
					if ( ! acc[ kind ] ) {
						acc[ kind ] = {};
					}
					if ( ! acc[ kind ][ name ] ) {
						acc[ kind ][ name ] = {};
					}
					editsKeys.forEach(
						( editsKey ) =>
							( acc[ kind ][ name ][ editsKey ] = {
								rawRecord: getRawEntityRecord( state, kind, name, editsKey ),
								edits: getEntityRecordNonTransientEdits(
									state,
									kind,
									name,
									editsKey
								),
							} )
					);
				}
			} );

			return acc;
		}, {} );
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
		Object.keys( getEntityRecordNonTransientEdits( state, kind, name, recordId ) )
			.length > 0
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
	return get( state.entities.data, [ kind, name, 'saving', recordId, 'error' ] );
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
 * Returns whether the current user can upload media.
 *
 * Calling this may trigger an OPTIONS request to the REST API via the
 * `canUser()` resolver.
 *
 * https://developer.wordpress.org/rest-api/reference/
 *
 * @deprecated since 5.0. Callers should use the more generic `canUser()` selector instead of
 *             `hasUploadPermissions()`, e.g. `canUser( 'create', 'media' )`.
 *
 * @param {Object} state Data state.
 *
 * @return {boolean} Whether or not the user can upload media. Defaults to `true` if the OPTIONS
 *                   request is being made.
 */
export function hasUploadPermissions( state ) {
	deprecated( "select( 'core' ).hasUploadPermissions()", {
		alternative: "select( 'core' ).canUser( 'create', 'media' )",
	} );
	return defaultTo( canUser( state, 'create', 'media' ), true );
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
export const hasFetchedAutosaves = createRegistrySelector( ( select ) => ( state, postType, postId ) => {
	return select( REDUCER_KEY ).hasFinishedResolution( 'getAutosaves', [ postType, postId ] );
} );

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
	( state ) => [ state.undo.length, state.undo.offset ],
);
