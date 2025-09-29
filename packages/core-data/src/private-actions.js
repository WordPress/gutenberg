/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';

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
						[ newRecord ],
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

export function receiveTemplateAutoDraftId( target, id ) {
	return { type: 'RECEIVE_TEMPLATE_AUTO_DRAFT_ID', target, id };
}

/**
 * Save entity records marked as dirty.
 *
 * @param {Object}   options                      Options for the action.
 * @param {Function} [options.onSave]             Callback when saving happens.
 * @param {object[]} [options.dirtyEntityRecords] Array of dirty entities.
 * @param {object[]} [options.entitiesToSkip]     Array of entities to skip saving.
 * @param {Function} [options.close]              Callback when the actions is called. It should be consolidated with `onSave`.
 */
export const saveDirtyEntities =
	( { onSave, dirtyEntityRecords = [], entitiesToSkip = [], close } = {} ) =>
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
						.saveEditedEntityRecord( kind, name, key )
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
						siteItemsToSave
					)
			);
		}
		/*registry
			.dispatch( blockEditorStore )
			.__unstableMarkLastChangeAsPersistent();*/
		Promise.all( pendingSavedRecords )
			.then( ( values ) => {
				return onSave ? onSave( values ) : values;
			} )
			.then( ( values ) => {
				if (
					values.some( ( value ) => typeof value === 'undefined' )
				) {
					registry
						.dispatch( noticesStore )
						.createErrorNotice( __( 'Saving failed.' ) );
				} else {
					registry
						.dispatch( noticesStore )
						.createSuccessNotice( __( 'Site updated.' ), {
							type: 'snackbar',
							id: saveNoticeId,
							actions: [
								{
									label: __( 'View site' ),
									url: homeUrl,
									openInNewTab: true,
								},
							],
						} );
				}
			} )
			.catch( ( error ) =>
				registry
					.dispatch( STORE_NAME )
					.createErrorNotice(
						`${ __( 'Saving failed.' ) } ${ error }`
					)
			);
	};
