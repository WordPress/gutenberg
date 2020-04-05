/**
 * External dependencies
 */
import { castArray, get, isEqual, find } from 'lodash';

/**
 * Internal dependencies
 */
import { receiveItems, receiveQueriedItems } from './queried-data';
import { getKindEntities, DEFAULT_ENTITY_KEY } from './entities';
import { select, apiFetch } from './controls';

/**
 * Returns an action object used in signalling that authors have been received.
 *
 * @param {string}       queryID Query ID.
 * @param {Array|Object} users   Users received.
 *
 * @return {Object} Action object.
 */
export function receiveUserQuery( queryID, users ) {
	return {
		type: 'RECEIVE_USER_QUERY',
		users: castArray( users ),
		queryID,
	};
}

/**
 * Returns an action used in signalling that the current user has been received.
 *
 * @param {Object} currentUser Current user object.
 *
 * @return {Object} Action object.
 */
export function receiveCurrentUser( currentUser ) {
	return {
		type: 'RECEIVE_CURRENT_USER',
		currentUser,
	};
}

/**
 * Returns an action object used in adding new entities.
 *
 * @param {Array} entities  Entities received.
 *
 * @return {Object} Action object.
 */
export function addEntities( entities ) {
	return {
		type: 'ADD_ENTITIES',
		entities,
	};
}

/**
 * Returns an action object used in signalling that entity records have been received.
 *
 * @param {string}       kind            Kind of the received entity.
 * @param {string}       name            Name of the received entity.
 * @param {Array|Object} records         Records received.
 * @param {?Object}      query           Query Object.
 * @param {?boolean}     invalidateCache Should invalidate query caches
 *
 * @return {Object} Action object.
 */
export function receiveEntityRecords(
	kind,
	name,
	records,
	query,
	invalidateCache = false
) {
	// Auto drafts should not have titles, but some plugins rely on them so we can't filter this
	// on the server.
	if ( kind === 'postType' ) {
		records = castArray( records ).map( ( record ) =>
			record.status === 'auto-draft' ? { ...record, title: '' } : record
		);
	}
	let action;
	if ( query ) {
		action = receiveQueriedItems( records, query );
	} else {
		action = receiveItems( records );
	}

	return {
		...action,
		kind,
		name,
		invalidateCache,
	};
}

/**
 * Returns an action object used in signalling that the index has been received.
 *
 * @param {Object} themeSupports Theme support for the current theme.
 *
 * @return {Object} Action object.
 */
export function receiveThemeSupports( themeSupports ) {
	return {
		type: 'RECEIVE_THEME_SUPPORTS',
		themeSupports,
	};
}

/**
 * Returns an action object used in signalling that the preview data for
 * a given URl has been received.
 *
 * @param {string}  url     URL to preview the embed for.
 * @param {*}       preview Preview data.
 *
 * @return {Object} Action object.
 */
export function receiveEmbedPreview( url, preview ) {
	return {
		type: 'RECEIVE_EMBED_PREVIEW',
		url,
		preview,
	};
}

/**
 * Returns an action object that triggers an
 * edit to an entity record.
 *
 * @param {string} kind     Kind of the edited entity record.
 * @param {string} name     Name of the edited entity record.
 * @param {number} recordId Record ID of the edited entity record.
 * @param {Object} edits    The edits.
 * @param {Object} options  Options for the edit.
 * @param {boolean} options.undoIgnore Whether to ignore the edit in undo history or not.
 *
 * @return {Object} Action object.
 */
export function* editEntityRecord( kind, name, recordId, edits, options = {} ) {
	const entity = yield select( 'getEntity', kind, name );
	if ( ! entity ) {
		throw new Error(
			`The entity being edited (${ kind }, ${ name }) does not have a loaded config.`
		);
	}
	const { transientEdits = {}, mergedEdits = {} } = entity;
	const record = yield select( 'getRawEntityRecord', kind, name, recordId );
	const editedRecord = yield select(
		'getEditedEntityRecord',
		kind,
		name,
		recordId
	);

	const edit = {
		kind,
		name,
		recordId,
		// Clear edits when they are equal to their persisted counterparts
		// so that the property is not considered dirty.
		edits: Object.keys( edits ).reduce( ( acc, key ) => {
			const recordValue = record[ key ];
			const editedRecordValue = editedRecord[ key ];
			const value = mergedEdits[ key ]
				? { ...editedRecordValue, ...edits[ key ] }
				: edits[ key ];
			acc[ key ] = isEqual( recordValue, value ) ? undefined : value;
			return acc;
		}, {} ),
		transientEdits,
	};
	return {
		type: 'EDIT_ENTITY_RECORD',
		...edit,
		meta: {
			undo: ! options.undoIgnore && {
				...edit,
				// Send the current values for things like the first undo stack entry.
				edits: Object.keys( edits ).reduce( ( acc, key ) => {
					acc[ key ] = editedRecord[ key ];
					return acc;
				}, {} ),
			},
		},
	};
}

/**
 * Action triggered to undo the last edit to
 * an entity record, if any.
 */
export function* undo() {
	const undoEdit = yield select( 'getUndoEdit' );
	if ( ! undoEdit ) {
		return;
	}
	yield {
		type: 'EDIT_ENTITY_RECORD',
		...undoEdit,
		meta: {
			isUndo: true,
		},
	};
}

/**
 * Action triggered to redo the last undoed
 * edit to an entity record, if any.
 */
export function* redo() {
	const redoEdit = yield select( 'getRedoEdit' );
	if ( ! redoEdit ) {
		return;
	}
	yield {
		type: 'EDIT_ENTITY_RECORD',
		...redoEdit,
		meta: {
			isRedo: true,
		},
	};
}

/**
 * Forces the creation of a new undo level.
 *
 * @return {Object} Action object.
 */
export function __unstableCreateUndoLevel() {
	return { type: 'CREATE_UNDO_LEVEL' };
}

/**
 * Action triggered to save an entity record.
 *
 * @param {string} kind    Kind of the received entity.
 * @param {string} name    Name of the received entity.
 * @param {Object} record  Record to be saved.
 * @param {Object} options Saving options.
 */
export function* saveEntityRecord(
	kind,
	name,
	record,
	{ isAutosave = false } = { isAutosave: false }
) {
	const entities = yield getKindEntities( kind );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}
	const entityIdKey = entity.key || DEFAULT_ENTITY_KEY;
	const recordId = record[ entityIdKey ];

	// Evaluate optimized edits.
	// (Function edits that should be evaluated on save to avoid expensive computations on every edit.)
	for ( const [ key, value ] of Object.entries( record ) ) {
		if ( typeof value === 'function' ) {
			const evaluatedValue = value(
				yield select( 'getEditedEntityRecord', kind, name, recordId )
			);
			yield editEntityRecord(
				kind,
				name,
				recordId,
				{
					[ key ]: evaluatedValue,
				},
				{ undoIgnore: true }
			);
			record[ key ] = evaluatedValue;
		}
	}

	yield {
		type: 'SAVE_ENTITY_RECORD_START',
		kind,
		name,
		recordId,
		isAutosave,
	};
	let updatedRecord;
	let error;
	let persistedEntity;
	let currentEdits;
	try {
		const path = `${ entity.baseURL }${ recordId ? '/' + recordId : '' }`;
		const persistedRecord = yield select(
			'getRawEntityRecord',
			kind,
			name,
			recordId
		);

		if ( isAutosave ) {
			// Most of this autosave logic is very specific to posts.
			// This is fine for now as it is the only supported autosave,
			// but ideally this should all be handled in the back end,
			// so the client just sends and receives objects.
			const currentUser = yield select( 'getCurrentUser' );
			const currentUserId = currentUser ? currentUser.id : undefined;
			const autosavePost = yield select(
				'getAutosave',
				persistedRecord.type,
				persistedRecord.id,
				currentUserId
			);
			// Autosaves need all expected fields to be present.
			// So we fallback to the previous autosave and then
			// to the actual persisted entity if the edits don't
			// have a value.
			let data = { ...persistedRecord, ...autosavePost, ...record };
			data = Object.keys( data ).reduce(
				( acc, key ) => {
					if ( [ 'title', 'excerpt', 'content' ].includes( key ) ) {
						// Edits should be the "raw" attribute values.
						acc[ key ] = get( data[ key ], 'raw', data[ key ] );
					}
					return acc;
				},
				{ status: data.status === 'auto-draft' ? 'draft' : data.status }
			);
			updatedRecord = yield apiFetch( {
				path: `${ path }/autosaves`,
				method: 'POST',
				data,
			} );
			// An autosave may be processed by the server as a regular save
			// when its update is requested by the author and the post had
			// draft or auto-draft status.
			if ( persistedRecord.id === updatedRecord.id ) {
				let newRecord = {
					...persistedRecord,
					...data,
					...updatedRecord,
				};
				newRecord = Object.keys( newRecord ).reduce( ( acc, key ) => {
					// These properties are persisted in autosaves.
					if ( [ 'title', 'excerpt', 'content' ].includes( key ) ) {
						// Edits should be the "raw" attribute values.
						acc[ key ] = get(
							newRecord[ key ],
							'raw',
							newRecord[ key ]
						);
					} else if ( key === 'status' ) {
						// Status is only persisted in autosaves when going from
						// "auto-draft" to "draft".
						acc[ key ] =
							persistedRecord.status === 'auto-draft' &&
							newRecord.status === 'draft'
								? newRecord.status
								: persistedRecord.status;
					} else {
						// These properties are not persisted in autosaves.
						acc[ key ] = get(
							persistedRecord[ key ],
							'raw',
							persistedRecord[ key ]
						);
					}
					return acc;
				}, {} );
				yield receiveEntityRecords(
					kind,
					name,
					newRecord,
					undefined,
					true
				);
			} else {
				yield receiveAutosaves( persistedRecord.id, updatedRecord );
			}
		} else {
			// Auto drafts should be converted to drafts on explicit saves and we should not respect their default title,
			// but some plugins break with this behavior so we can't filter it on the server.
			let data = record;
			if (
				kind === 'postType' &&
				persistedRecord &&
				persistedRecord.status === 'auto-draft'
			) {
				if ( ! data.status ) {
					data = { ...data, status: 'draft' };
				}
				if ( ! data.title || data.title === 'Auto Draft' ) {
					data = { ...data, title: '' };
				}
			}

			// Get the full local version of the record before the update,
			// to merge it with the edits and then propagate it to subscribers
			persistedEntity = yield select(
				'__experimentalGetEntityRecordNoResolver',
				kind,
				name,
				recordId
			);
			currentEdits = yield select(
				'getEntityRecordEdits',
				kind,
				name,
				recordId
			);
			yield receiveEntityRecords(
				kind,
				name,
				{ ...persistedEntity, ...data },
				undefined,
				true
			);

			updatedRecord = yield apiFetch( {
				path,
				method: recordId ? 'PUT' : 'POST',
				data,
			} );
			yield receiveEntityRecords(
				kind,
				name,
				updatedRecord,
				undefined,
				true
			);
		}
	} catch ( _error ) {
		error = _error;

		// If we got to the point in the try block where we made an optimistic update,
		// we need to roll it back here.
		if ( persistedEntity && currentEdits ) {
			yield receiveEntityRecords(
				kind,
				name,
				persistedEntity,
				undefined,
				true
			);
			yield editEntityRecord(
				kind,
				name,
				recordId,
				{
					...currentEdits,
					...( yield select(
						'getEntityRecordEdits',
						kind,
						name,
						recordId
					) ),
				},
				{ undoIgnore: true }
			);
		}
	}
	yield {
		type: 'SAVE_ENTITY_RECORD_FINISH',
		kind,
		name,
		recordId,
		error,
		isAutosave,
	};

	return updatedRecord;
}

/**
 * Action triggered to save an entity record's edits.
 *
 * @param {string} kind     Kind of the entity.
 * @param {string} name     Name of the entity.
 * @param {Object} recordId ID of the record.
 * @param {Object} options  Saving options.
 */
export function* saveEditedEntityRecord( kind, name, recordId, options ) {
	if (
		! ( yield select( 'hasEditsForEntityRecord', kind, name, recordId ) )
	) {
		return;
	}
	const edits = yield select(
		'getEntityRecordNonTransientEdits',
		kind,
		name,
		recordId
	);
	const record = { id: recordId, ...edits };
	yield* saveEntityRecord( kind, name, record, options );
}

/**
 * Returns an action object used in signalling that Upload permissions have been received.
 *
 * @param {boolean} hasUploadPermissions Does the user have permission to upload files?
 *
 * @return {Object} Action object.
 */
export function receiveUploadPermissions( hasUploadPermissions ) {
	return {
		type: 'RECEIVE_USER_PERMISSION',
		key: 'create/media',
		isAllowed: hasUploadPermissions,
	};
}

/**
 * Returns an action object used in signalling that the current user has
 * permission to perform an action on a REST resource.
 *
 * @param {string}  key       A key that represents the action and REST resource.
 * @param {boolean} isAllowed Whether or not the user can perform the action.
 *
 * @return {Object} Action object.
 */
export function receiveUserPermission( key, isAllowed ) {
	return {
		type: 'RECEIVE_USER_PERMISSION',
		key,
		isAllowed,
	};
}

/**
 * Returns an action object used in signalling that the autosaves for a
 * post have been received.
 *
 * @param {number}       postId    The id of the post that is parent to the autosave.
 * @param {Array|Object} autosaves An array of autosaves or singular autosave object.
 *
 * @return {Object} Action object.
 */
export function receiveAutosaves( postId, autosaves ) {
	return {
		type: 'RECEIVE_AUTOSAVES',
		postId,
		autosaves: castArray( autosaves ),
	};
}
