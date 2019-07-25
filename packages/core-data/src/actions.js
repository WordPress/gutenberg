/**
 * External dependencies
 */
import { castArray, find, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import {
	receiveItems,
	receiveQueriedItems,
} from './queried-data';
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
export function receiveEntityRecords( kind, name, records, query, invalidateCache = false ) {
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
 * @param {string}  url      URL to preview the embed for.
 * @param {Mixed}   preview  Preview data.
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
 * Action triggered to save an entity record.
 *
 * @param {string} kind    Kind of the received entity.
 * @param {string} name    Name of the received entity.
 * @param {Object} record  Record to be saved.
 */
export function* saveEntityRecord( kind, name, record ) {
	const entities = yield getKindEntities( kind );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}
	const key = entity.key || DEFAULT_ENTITY_KEY;
	const recordId = record[ key ];
	yield { type: 'SAVE_ENTITY_RECORD_START', kind, name, recordId };
	const updatedRecord = yield apiFetch( {
		path: `${ entity.baseURL }${ recordId ? '/' + recordId : '' }`,
		method: recordId ? 'PUT' : 'POST',
		data: record,
	} );
	let error;
	try {
		yield receiveEntityRecords( kind, name, updatedRecord, undefined, true );
	} catch ( _error ) {
		error = _error;
	}
	yield { type: 'SAVE_ENTITY_RECORD_FINISH', kind, name, recordId, error };
}

export function* editEntityRecord( kind, name, recordId, edits ) {
	const record = yield select( 'getEditedEntityRecord', kind, name, recordId );

	return {
		type: 'EDIT_ENTITY_RECORD',
		kind,
		name,
		recordId,
		edits,
		meta: {
			undo: {
				type: 'EDIT_ENTITY_RECORD',
				kind,
				name,
				recordId,
				edits: mapValues( edits, ( value, key ) => record[ key ] ),
			},
		},
	};
}

export function* undo() {
	if ( ! ( yield select( 'hasUndo' ) ) ) {
		return;
	}

	const [ kind, name, recordId, edits ] = yield select( 'getUndoEdit' );
	yield {
		type: 'EDIT_ENTITY_RECORD',
		kind,
		name,
		recordId,
		edits,
		meta: {
			isUndo: true,
		},
	};
}

export function* redo() {
	if ( ! ( yield select( 'hasRedo' ) ) ) {
		return;
	}

	const [ kind, name, recordId, edits ] = yield select( 'getRedoEdit' );
	yield {
		type: 'EDIT_ENTITY_RECORD',
		kind,
		name,
		recordId,
		edits,
		meta: {
			isRedo: true,
		},
	};
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
