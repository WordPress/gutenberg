/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { parse, serialize } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';
import { getSyncManager, hasSyncManager } from './sync';
import { enqueueCRDTDocSave, saveCRDTDoc } from './utils';

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
 * Persists the current CRDT document for a sync-enabled entity.
 *
 * @param {string}        kind     Entity kind.
 * @param {string}        name     Entity name.
 * @param {number|string} recordId Entity record ID.
 * @return {Promise<boolean>} Whether a CRDT document was persisted.
 */
export const persistEntityCRDTDoc =
	( kind, name, recordId ) =>
	async ( { select } ) => {
		const entityConfig = select.getEntityConfig( kind, name );
		if ( ! entityConfig?.syncConfig?.supportsPersistence ) {
			return false;
		}

		return saveCRDTDoc( `${ kind }/${ name }`, recordId );
	};

function getRawContent( record ) {
	const content = record?.content;
	if ( typeof content === 'string' ) {
		return content;
	}
	return typeof content?.raw === 'string' ? content.raw : '';
}

function findBlockPaths( blocks, isMatch ) {
	const paths = [];
	for ( let index = 0; index < blocks.length; index++ ) {
		const block = blocks[ index ];
		if ( isMatch( block ) ) {
			paths.push( [ index ] );
		}

		paths.push(
			...findBlockPaths( block.innerBlocks || [], isMatch ).map(
				( childPath ) => [ index, ...childPath ]
			)
		);
	}

	return paths;
}

function countBlocks( blocks ) {
	return blocks.reduce(
		( count, block ) => count + 1 + countBlocks( block.innerBlocks || [] ),
		0
	);
}

function getBlockAtPath( blocks, path ) {
	return path.reduce(
		( currentBlock, index ) =>
			Array.isArray( currentBlock )
				? currentBlock[ index ]
				: currentBlock?.innerBlocks?.[ index ],
		blocks
	);
}

function updateBlockAttributesAtPath( blocks, path, attributes ) {
	const [ index, ...rest ] = path;
	const block = blocks[ index ];
	if ( ! block ) {
		return null;
	}

	const nextBlocks = [ ...blocks ];
	if ( rest.length ) {
		const innerBlocks = updateBlockAttributesAtPath(
			block.innerBlocks || [],
			rest,
			attributes
		);
		if ( ! innerBlocks ) {
			return null;
		}

		nextBlocks[ index ] = {
			...block,
			innerBlocks,
		};
		return nextBlocks;
	}

	const attributeChanges =
		typeof attributes === 'function'
			? attributes( block.attributes || {} )
			: attributes;
	if ( ! attributeChanges ) {
		return null;
	}

	nextBlocks[ index ] = {
		...block,
		attributes: {
			...block.attributes,
			...attributeChanges,
		},
	};
	return nextBlocks;
}

/**
 * Persists targeted block attribute changes against a sync-enabled entity's
 * saved content and CRDT document without using unrelated dirty editor state.
 *
 * @param {string}          kind               Entity kind.
 * @param {string}          name               Entity name.
 * @param {number|string}   recordId           Entity record ID.
 * @param {Object}          options            Options.
 * @param {Object}          options.record     Saved entity record snapshot.
 * @param {number[]}        options.blockPath  Path to the block in saved content.
 * @param {Object|Function} options.attributes Attribute changes or updater.
 * @param {Function}        options.isMatch    Optional block matcher for path validation.
 * @param {number}          options.matchIndex Zero-based occurrence of the matched live block.
 * @param {number}          options.matchCount Number of matching blocks in the live tree.
 * @param {number}          options.blockCount Number of blocks in the live tree.
 * @param {string}          options.blockName  Name of the live target block.
 * @return {Promise<boolean>} Whether block attributes were persisted.
 */
export const persistEntityBlockAttributes =
	(
		kind,
		name,
		recordId,
		{
			record,
			blockPath,
			attributes,
			isMatch,
			matchIndex,
			matchCount,
			blockCount,
			blockName,
		}
	) =>
	async ( { select } ) => {
		const entityConfig = select.getEntityConfig( kind, name );
		if (
			! entityConfig?.baseURL ||
			! entityConfig?.syncConfig?.supportsPersistence ||
			! Array.isArray( blockPath )
		) {
			return false;
		}

		const objectType = `${ kind }/${ name }`;
		const room = `${ objectType }:${ recordId }`;
		return enqueueCRDTDocSave( objectType, recordId, async () => {
			const initialRecord =
				select.getRawEntityRecord?.( kind, name, recordId ) || record;
			if ( ! getRawContent( initialRecord ) ) {
				return false;
			}

			for ( let attempt = 0; attempt < 20; attempt++ ) {
				const persistedRecord = await apiFetch( {
					path: `${ entityConfig.baseURL }/${ recordId }?context=edit`,
				} );
				const content = getRawContent( persistedRecord || record );
				if ( ! content ) {
					return false;
				}

				const parsedBlocks = parse( content );
				let targetPath = blockPath;
				if ( isMatch ) {
					const matchingPaths = findBlockPaths(
						parsedBlocks,
						isMatch
					);
					if (
						! Number.isInteger( matchIndex ) ||
						! Number.isInteger( matchCount )
					) {
						return false;
					}

					if ( matchingPaths.length === matchCount ) {
						targetPath = matchingPaths[ matchIndex ];
					} else {
						const pathBlock = getBlockAtPath(
							parsedBlocks,
							blockPath
						);
						const canUseDirtyPath =
							matchingPaths.length === 0 &&
							matchCount === 1 &&
							Number.isInteger( blockCount ) &&
							countBlocks( parsedBlocks ) === blockCount &&
							pathBlock?.name === blockName;
						if ( ! canUseDirtyPath ) {
							return false;
						}
					}
				}

				if ( ! targetPath ) {
					return false;
				}

				const blocks = updateBlockAttributesAtPath(
					parsedBlocks,
					targetPath,
					attributes
				);
				if ( ! blocks ) {
					return false;
				}

				const serializedDoc =
					await getSyncManager()?.createPersistedCRDTDoc(
						objectType,
						recordId,
						{ blocks }
					);
				if ( ! serializedDoc ) {
					return false;
				}

				try {
					await apiFetch( {
						path: '/wp-sync/v1/save-entity',
						method: 'POST',
						data: {
							room,
							expected_content: content,
							content: serialize( blocks ),
							doc: serializedDoc,
						},
					} );
				} catch ( error ) {
					if ( error?.code === 'rest_sync_content_conflict' ) {
						continue;
					}
					throw error;
				}

				return true;
			}

			return false;
		} );
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
		registry
			.dispatch( blockEditorStore )
			.__unstableMarkLastChangeAsPersistent();

		Promise.all( pendingSavedRecords )
			.then( async ( values ) => {
				if ( onSave ) {
					await onSave();
				}
				return values;
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
						`${ __( 'Saving failed.' ) } ${ error }`
					)
			);
	};
