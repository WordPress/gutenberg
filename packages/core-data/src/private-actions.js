/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';
import { getSyncManager, hasSyncManager } from './sync';

/**
 * Returns an action object used in signalling that the registered post meta
 * fields for a post type have been received.
 *
 * @param {string} postType           Post type slug.
 * @param {Object} registeredPostMeta Registered post meta.
 *
 * @return {Object} Action object.
 */
export function receiveRegisteredPostMeta( postType, registeredPostMeta ) {
	return {
		type: 'RECEIVE_REGISTERED_POST_META',
		postType,
		registeredPostMeta,
	};
}

/**
 * @typedef {Object} Modifier
 * @property {string} [type] - The type of modifier.
 * @property {Object} [args] - The arguments of the modifier.
 */

/**
 * @typedef {Object} Edits
 * @property {string}     [src]       - The URL of the media item.
 * @property {Modifier[]} [modifiers] - The modifiers to apply to the media item.
 */

/**
 * Duplicates a media (attachment) entity record and, optionally, modifies it.
 *
 * @param {string}   recordId                Entity record ID.
 * @param {Edits}    edits                   Edits to apply to the record.
 * @param {Object}   options                 Options object.
 * @param {Function} options.__unstableFetch Custom fetch function.
 * @param {boolean}  options.throwOnError    Whether to throw an error if the request fails.
 *
 * @return {Promise} Promise resolving to the updated record.
 */
export const editMediaEntity =
	(
		recordId,
		edits = {},
		{ __unstableFetch = apiFetch, throwOnError = false } = {}
	) =>
	async ( { dispatch, resolveSelect } ) => {
		if ( ! recordId ) {
			return;
		}

		const kind = 'postType';
		const name = 'attachment';

		const configs = await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.kind === kind && config.name === name
		);

		if ( ! entityConfig ) {
			return;
		}

		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[ 'entities', 'records', kind, name, recordId ],
			{ exclusive: true }
		);

		let updatedRecord;
		let error;
		let hasError = false;

		try {
			dispatch( {
				type: 'SAVE_ENTITY_RECORD_START',
				kind,
				name,
				recordId,
			} );

			try {
				const path = `${ entityConfig.baseURL }/${ recordId }/edit`;
				const newRecord = await __unstableFetch( {
					path,
					method: 'POST',
					data: {
						...edits,
					},
				} );

				if ( newRecord ) {
					dispatch.receiveEntityRecords(
						kind,
						name,
						newRecord,
						undefined,
						true,
						undefined,
						undefined
					);
					updatedRecord = newRecord;
				}
			} catch ( e ) {
				error = e;
				hasError = true;
			}

			dispatch( {
				type: 'SAVE_ENTITY_RECORD_FINISH',
				kind,
				name,
				recordId,
				error,
			} );

			if ( hasError && throwOnError ) {
				throw error;
			}
			return updatedRecord;
		} finally {
			dispatch.__unstableReleaseStoreLock( lock );
		}
	};

/**
 * Returns an action object used to receive editor settings.
 *
 * @param {Object} settings Editor settings object.
 *
 * @return {Object} Action object.
 */
export function receiveEditorSettings( settings ) {
	return {
		type: 'RECEIVE_EDITOR_SETTINGS',
		settings,
	};
}

/**
 * Returns an action object used to receive editor assets.
 *
 * @param {Object} assets Editor assets object.
 *
 * @return {Object} Action object.
 */
export function receiveEditorAssets( assets ) {
	return {
		type: 'RECEIVE_EDITOR_ASSETS',
		assets,
	};
}

/**
 * Returns an action object used to set whether collaboration is supported.
 * When set to false, also disconnects all sync entities.
 *
 * @param {boolean} supported Whether collaboration is supported.
 *
 * @return {Object} Action object.
 */
export const setCollaborationSupported =
	( supported ) =>
	( { dispatch } ) => {
		dispatch( { type: 'SET_COLLABORATION_SUPPORTED', supported } );
		if ( ! supported && hasSyncManager() ) {
			getSyncManager().unloadAll();
			dispatch.__unstableNotifySyncUndoManagerChange( {
				hasUndo: false,
				hasRedo: false,
			} );
		}
	};

/**
 * Returns an action object used to receive view config.
 *
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {Object} config View config object.
 *
 * @return {Object} Action object.
 */
export function receiveViewConfig( kind, name, config ) {
	return {
		type: 'RECEIVE_VIEW_CONFIG',
		kind,
		name,
		config,
	};
}

/**
 * Returns an action object used to notify core-data that the sync undo manager
 * state changed outside of the core-data reducer, e.g. The Yjs UndoManager
 * captured an undo level.
 *
 * @param {Object}  state         The sync undo stack state.
 * @param {boolean} state.hasRedo Whether there are changes to redo.
 * @param {boolean} state.hasUndo Whether there are changes to undo.
 *
 * @return {Object} Action object.
 */
export function __unstableNotifySyncUndoManagerChange( state ) {
	return {
		type: 'SYNC_UNDO_MANAGER_CHANGE',
		...state,
	};
}

/**
 * Returns an action object used to set the sync connection status for an entity or collection.
 *
 * @param {string}             kind   Kind of the entity.
 * @param {string}             name   Name of the entity.
 * @param {number|string|null} key    The entity key, or null for collections.
 * @param {Object|null}        status The connection state object or null on unload.
 *
 * @return {Object} Action object.
 */
export function setSyncConnectionStatus( kind, name, key, status ) {
	if ( ! status ) {
		return {
			type: 'CLEAR_SYNC_CONNECTION_STATUS',
			kind,
			name,
			key,
		};
	}

	return {
		type: 'SET_SYNC_CONNECTION_STATUS',
		kind,
		name,
		key,
		status,
	};
}

/**
 * Save entity records marked as dirty.
 *
 * @param {Object}   options                        Options for the action.
 * @param {Function} [options.onSave]               Callback when saving happens.
 * @param {object[]} [options.dirtyEntityRecords]   Array of dirty entities.
 * @param {object[]} [options.entitiesToSkip]       Array of entities to skip saving.
 * @param {Function} [options.close]                Callback when the actions is called. It should be consolidated with `onSave`.
 * @param {string}   [options.successNoticeContent] Optional custom success notice content. Defaults to 'Site updated.'.
 */
export const saveDirtyEntities =
	( {
		onSave,
		dirtyEntityRecords = [],
		entitiesToSkip = [],
		close,
		successNoticeContent,
	} = {} ) =>
	( { registry } ) => {
		const PUBLISH_ON_SAVE_ENTITIES = [
			{ kind: 'postType', name: 'wp_navigation' },
		];
		const saveNoticeId = 'site-editor-save-success';
		const homeUrl = registry
			.select( STORE_NAME )
			.getEntityRecord( 'root', '__unstableBase' )?.home;
		registry.dispatch( noticesStore ).removeNotice( saveNoticeId );
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key, property } ) => {
				return ! entitiesToSkip.some(
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key &&
						elt.property === property
				);
			}
		);
		close?.( entitiesToSave );
		const siteItemsToSave = [];
		const pendingSavedRecords = [];
		entitiesToSave.forEach( ( { kind, name, key, property } ) => {
			if ( 'root' === kind && 'site' === name ) {
				siteItemsToSave.push( property );
			} else {
				if (
					PUBLISH_ON_SAVE_ENTITIES.some(
						( typeToPublish ) =>
							typeToPublish.kind === kind &&
							typeToPublish.name === name
					)
				) {
					registry
						.dispatch( STORE_NAME )
						.editEntityRecord( kind, name, key, {
							status: 'publish',
						} );
				}

				pendingSavedRecords.push(
					registry
						.dispatch( STORE_NAME )
						.saveEditedEntityRecord( kind, name, key, {
							throwOnError: true,
						} )
						.catch( ensureError )
				);
			}
		} );
		if ( siteItemsToSave.length ) {
			pendingSavedRecords.push(
				registry
					.dispatch( STORE_NAME )
					.__experimentalSaveSpecifiedEntityEdits(
						'root',
						'site',
						undefined,
						siteItemsToSave,
						{
							throwOnError: true,
						}
					)
					.catch( ensureError )
			);
		}
		registry
			.dispatch( blockEditorStore )
			.__unstableMarkLastChangeAsPersistent();

		return Promise.all( pendingSavedRecords )
			.then( async ( values ) => {
				if ( onSave ) {
					await onSave();
				}
				return values;
			} )
			.then( ( values ) => {
				const errors = values.filter( ( v ) => v instanceof Error );
				if ( errors.length ) {
					const firstMessage = errors.find(
						( e ) => e.message
					)?.message;

					registry
						.dispatch( noticesStore )
						.createErrorNotice(
							decodeEntities(
								firstMessage || __( 'Saving failed.' )
							),
							{
								type: 'snackbar',
								id: saveNoticeId,
							}
						);
				} else {
					registry
						.dispatch( noticesStore )
						.createSuccessNotice(
							successNoticeContent || __( 'Site updated.' ),
							{
								type: 'snackbar',
								id: saveNoticeId,
								actions: [
									{
										label: __( 'View site' ),
										url: homeUrl,
										openInNewTab: true,
									},
								],
							}
						);
				}
			} )
			.catch( ( error ) =>
				registry
					.dispatch( noticesStore )
					.createErrorNotice(
						decodeEntities(
							error?.message || __( 'Saving failed.' )
						),
						{
							type: 'snackbar',
							id: saveNoticeId,
						}
					)
			);

		function ensureError( error ) {
			if ( error instanceof Error ) {
				return error;
			}

			// Expect certain errors to be plain objects with a `message`
			// property, such as those thrown by `apiFetch`. Otherwise, do our
			// best to infer a message via duck typing.
			let message;
			if ( ! error ) {
			} else if ( typeof error.message === 'string' ) {
				message = error.message;
			} else if ( typeof error === 'string' ) {
				message = error;
			} else if (
				// Only consider own method, lest we erroneously end up calling
				// `Object#toString` at the end of the prototype chain, thereby
				// returning `"[object Object]"`.
				Object.hasOwn( error, 'toString' ) &&
				typeof error.toString === 'function'
			) {
				const result = error.toString();
				if ( typeof result === 'string' ) {
					message = result;
				}
			}

			return new Error( message, { cause: error } );
		}
	};
