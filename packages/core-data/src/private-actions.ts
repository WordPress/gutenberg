import apiFetch from '@wordpress/api-fetch';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import type { ConnectionStatus } from '@wordpress/sync';
import { STORE_NAME } from './name';
import { getEntitySyncManager } from './entity-sync';
import { createSyncUndoLevelRecord } from './utils/sync-undo-levels';
import type { EntityActionsConfig, FieldsConfig } from './private-selectors';
import type {
	ActionOf,
	CoreDataThunkArgs,
	EditedMediaRecord,
	MediaEdits,
	SaveDirtyEntitiesOptions,
} from './private-types';
import type { DeleteEntityRecordOptions, EntityConfig } from './types';

/**
 * Returns an action object used in signalling that the registered post meta
 * fields for a post type have been received.
 *
 * @param postType           Post type slug.
 * @param registeredPostMeta Registered post meta.
 *
 * @return Action object.
 */
export function receiveRegisteredPostMeta(
	postType: string,
	registeredPostMeta: Record< string, unknown > | undefined
): ActionOf< 'RECEIVE_REGISTERED_POST_META' > {
	return {
		type: 'RECEIVE_REGISTERED_POST_META',
		postType,
		registeredPostMeta,
	};
}

/**
 * Duplicates a media (attachment) entity record and, optionally, modifies it.
 *
 * @param recordId                Entity record ID.
 * @param edits                   Edits to apply to the record.
 * @param options                 Options object.
 * @param options.__unstableFetch Custom fetch function.
 * @param options.throwOnError    Whether to throw an error if the request fails.
 *
 * @return Promise resolving to the updated record.
 */
export const editMediaEntity =
	(
		recordId: string | number,
		// The endpoint rejects the empty default, which only a call without edits sends.
		edits: MediaEdits | Record< string, never > = {},
		{
			__unstableFetch = apiFetch,
			throwOnError = false,
		}: DeleteEntityRecordOptions = {}
	) =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		if ( ! recordId ) {
			return;
		}

		const kind = 'postType';
		const name = 'attachment';

		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
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

		let updatedRecord: EditedMediaRecord | undefined;
		let error: unknown;
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
				// The REST API responds with the duplicated attachment.
				const newRecord = ( await __unstableFetch( {
					path,
					method: 'POST',
					data: {
						...edits,
					},
				} ) ) as EditedMediaRecord | undefined;

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
 * @param settings Editor settings object.
 *
 * @return Action object.
 */
export function receiveEditorSettings(
	settings: Record< string, unknown >
): ActionOf< 'RECEIVE_EDITOR_SETTINGS' > {
	return {
		type: 'RECEIVE_EDITOR_SETTINGS',
		settings,
	};
}

/**
 * Returns an action object used to receive editor assets.
 *
 * @param assets Editor assets object.
 *
 * @return Action object.
 */
export function receiveEditorAssets(
	assets: Record< string, unknown >
): ActionOf< 'RECEIVE_EDITOR_ASSETS' > {
	return {
		type: 'RECEIVE_EDITOR_ASSETS',
		assets,
	};
}

/**
 * Returns an action object used to set whether collaboration is supported.
 * When set to false, also disconnects all sync entities.
 *
 * @param supported Whether collaboration is supported.
 *
 * @return Action object.
 */
export const setCollaborationSupported =
	( supported: boolean ) =>
	( { dispatch }: CoreDataThunkArgs ) => {
		dispatch( { type: 'SET_COLLABORATION_SUPPORTED', supported } );
		if ( ! supported ) {
			getEntitySyncManager()?.unloadAll();
		}
	};

/**
 * Returns an action object used to receive view config.
 *
 * @param kind   Entity kind.
 * @param name   Entity name.
 * @param config View config object.
 *
 * @return Action object.
 */
export function receiveViewConfig(
	kind: string,
	name: string,
	config: Record< string, unknown >
): ActionOf< 'RECEIVE_VIEW_CONFIG' > {
	return {
		type: 'RECEIVE_VIEW_CONFIG',
		kind,
		name,
		config,
	};
}

/**
 * Returns an action object used to receive the fields config of an entity.
 *
 * @param kind   Entity kind.
 * @param name   Entity name.
 * @param config Fields config, as returned by the `/wp/v2/entity-fields` route.
 *
 * @return Action object.
 */
export function receiveFieldsConfig(
	kind: string,
	name: string,
	config: FieldsConfig
): ActionOf< 'RECEIVE_FIELDS_CONFIG' > {
	return {
		type: 'RECEIVE_FIELDS_CONFIG',
		kind,
		name,
		config,
	};
}

/**
 * Returns an action object used to receive the actions config of an entity.
 *
 * @param kind   Entity kind.
 * @param name   Entity name.
 * @param config Actions config, as returned by the `/wp/v2/entity-actions` route.
 *
 * @return Action object.
 */
export function receiveEntityActionsConfig(
	kind: string,
	name: string,
	config: EntityActionsConfig
): ActionOf< 'RECEIVE_ENTITY_ACTIONS_CONFIG' > {
	return {
		type: 'RECEIVE_ENTITY_ACTIONS_CONFIG',
		kind,
		name,
		config,
	};
}

/**
 * Records that the entity sync manager opened a new undo level for a record
 * it syncs, so the level takes its place in core-data's undo history next to
 * the edits core-data records itself.
 *
 * @param kind     Kind of the record.
 * @param name     Name of the record.
 * @param recordId Id of the record.
 */
export const recordSyncUndoLevel =
	( kind: string, name: string, recordId: number | string ) =>
	( { select, dispatch }: CoreDataThunkArgs ) => {
		select
			.getUndoManager()
			.addRecord( createSyncUndoLevelRecord( kind, name, recordId ) );

		// The undo manager is a mutable object held in state, so change
		// state for `hasUndo` and `hasRedo` to be read again. The sync
		// manager reports levels outside of entity edits, for example after
		// a deferred document update.
		dispatch( { type: 'RECORD_SYNC_UNDO_LEVEL' } );
	};

/**
 * Returns an action object used to set the sync connection status for an entity or collection.
 *
 * @param kind   Kind of the entity.
 * @param name   Name of the entity.
 * @param key    The entity key, or null for collections.
 * @param status The connection state object or null on unload.
 *
 * @return Action object.
 */
export function setSyncConnectionStatus(
	kind: string,
	name: string,
	key: number | string | null,
	status: ConnectionStatus | null
): ActionOf< 'CLEAR_SYNC_CONNECTION_STATUS' | 'SET_SYNC_CONNECTION_STATUS' > {
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
 * @param options                      Options for the action.
 * @param options.onSave               Callback when saving happens.
 * @param options.dirtyEntityRecords   Array of dirty entities.
 * @param options.entitiesToSkip       Array of entities to skip saving.
 * @param options.close                Callback when the actions is called. It should be consolidated with `onSave`.
 * @param options.successNoticeContent Optional custom success notice content. Defaults to 'Site updated.'.
 */
export const saveDirtyEntities =
	( {
		onSave,
		dirtyEntityRecords = [],
		entitiesToSkip = [],
		close,
		successNoticeContent,
	}: SaveDirtyEntitiesOptions = {} ) =>
	( { registry }: CoreDataThunkArgs ): Promise< unknown > => {
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
		const siteItemsToSave: Array< string > = [];
		const pendingSavedRecords: Array< Promise< unknown > > = [];
		entitiesToSave.forEach( ( { kind, name, key, property } ) => {
			if ( 'root' === kind && 'site' === name ) {
				// Site entries name the edited property.
				siteItemsToSave.push( property! );
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

		function ensureError( error: unknown ): Error {
			if ( error instanceof Error ) {
				return error;
			}

			// Expect certain errors to be plain objects with a `message`
			// property, such as those thrown by `apiFetch`. Otherwise, do our
			// best to infer a message via duck typing.
			let message: string | undefined;
			if ( ! error ) {
				// The checks below read the error by duck typing.
			} else if (
				typeof ( error as { message?: unknown } ).message === 'string'
			) {
				message = ( error as { message: string } ).message;
			} else if ( typeof error === 'string' ) {
				message = error;
			} else if (
				// Only consider own method, lest we erroneously end up calling
				// `Object#toString` at the end of the prototype chain, thereby
				// returning `"[object Object]"`.
				Object.hasOwn( error as object, 'toString' ) &&
				typeof ( error as { toString?: unknown } ).toString ===
					'function'
			) {
				const result = (
					error as { toString: () => unknown }
				 ).toString();
				if ( typeof result === 'string' ) {
					message = result;
				}
			}

			return new Error( message, { cause: error } );
		}
	};
