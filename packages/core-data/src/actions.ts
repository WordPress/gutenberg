import { v4 as uuid } from 'uuid';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import deprecated from '@wordpress/deprecated';
import type { ActionCreatorWithCustomDispatchSignature } from '@wordpress/data';
import { clearUnchangedEdits, getNestedValue, setNestedValue } from './utils';
import { receiveItems, removeItems, receiveQueriedItems } from './queried-data';
import { DEFAULT_ENTITY_KEY } from './entities';
import { createBatch } from './batch';
import { STORE_NAME } from './name';
import { getEntitySyncManager } from './entity-sync';
import { applyUndoLevel, recordEntityEdit } from './utils/sync-undo-levels';
import logEntityDeprecation from './utils/log-entity-deprecation';
import type * as ET from './entity-types';
import type { QueriedItem, QueriedMeta, Query } from './queried-data/types';
import type { ActionOf, CoreDataThunkArgs } from './private-types';
import type {
	BatchActions,
	BatchRequest,
	BatchResults,
	DeleteEntityRecordOptions,
	EditEntityRecordOptions,
	EntityConfig,
	RestRecord,
	SaveEntityRecordOptions,
} from './types';

function addTitleToAutoDraft( record: object ): object {
	// A post's status is a string.
	return ( record as { status?: string } ).status === 'auto-draft'
		? { ...record, title: '' }
		: record;
}

/**
 * Returns an action object used in signalling that authors have been received.
 * Ignored from documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param queryID Query ID.
 * @param users   Users received.
 *
 * @return Action object.
 */
export function receiveUserQuery(
	queryID: string,
	users: ET.User< 'view' > | Array< ET.User< 'view' > >
): ActionOf< 'RECEIVE_USER_QUERY' > {
	return {
		type: 'RECEIVE_USER_QUERY',
		users: Array.isArray( users ) ? users : [ users ],
		queryID,
	};
}

/**
 * Returns an action used in signalling that the current user has been received.
 * Ignored from documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param currentUser Current user object.
 *
 * @return Action object.
 */
export function receiveCurrentUser(
	currentUser: ET.User< 'view' >
): ActionOf< 'RECEIVE_CURRENT_USER' > {
	return {
		type: 'RECEIVE_CURRENT_USER',
		currentUser,
	};
}

/**
 * Returns an action object used in adding new entities.
 *
 * @param entities Entities received.
 *
 * @return Action object.
 */
export function addEntities(
	entities: Array< EntityConfig >
): ActionOf< 'ADD_ENTITIES' > {
	return {
		type: 'ADD_ENTITIES',
		entities,
	};
}

/**
 * Returns an action object used in signalling that entity records have been received.
 *
 * @param kind            Kind of the received entity record.
 * @param name            Name of the received entity record.
 * @param records         Records received.
 * @param query           Query Object.
 * @param invalidateCache Should invalidate query caches.
 * @param edits           Edits to reset.
 * @param meta            Meta information about pagination.
 * @return Action object.
 */
export function receiveEntityRecords(
	kind: string,
	name: string,
	records: object | Array< object >,
	query: Query | null | undefined = undefined,
	invalidateCache: boolean | null = false,
	edits: object | null | undefined = undefined,
	meta: QueriedMeta | null | undefined = undefined
) {
	// Auto drafts should not have titles, but some plugins rely on them so we can't filter this
	// on the server.
	if ( kind === 'postType' ) {
		records = Array.isArray( records )
			? records.map( addTitleToAutoDraft )
			: addTitleToAutoDraft( records );
	}
	let action;
	if ( query ) {
		action = receiveQueriedItems(
			// Records are read by their fields' names.
			records as QueriedItem | Array< QueriedItem >,
			query,
			// Edits are read by their fields' names.
			edits as Record< string, unknown > | null | undefined,
			meta
		);
	} else {
		action = receiveItems(
			// Records are read by their fields' names.
			records as QueriedItem | Array< QueriedItem >,
			// Edits are read by their fields' names.
			edits as Record< string, unknown > | null | undefined,
			meta
		);
	}

	return {
		...action,
		kind,
		name,
		invalidateCache,
	};
}

/**
 * Returns an action object used in signalling that the current theme has been received.
 * Ignored from documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param currentTheme The current theme.
 *
 * @return Action object.
 */
export function receiveCurrentTheme(
	currentTheme: Pick< ET.Theme, 'stylesheet' >
): ActionOf< 'RECEIVE_CURRENT_THEME' > {
	return {
		type: 'RECEIVE_CURRENT_THEME',
		currentTheme,
	};
}

/**
 * Returns an action object used in signalling that the current global styles id has been received.
 * Ignored from documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param currentGlobalStylesId The current global styles id.
 *
 * @return Action object.
 */
export function __experimentalReceiveCurrentGlobalStylesId(
	currentGlobalStylesId: number
): ActionOf< 'RECEIVE_CURRENT_GLOBAL_STYLES_ID' > {
	return {
		type: 'RECEIVE_CURRENT_GLOBAL_STYLES_ID',
		id: currentGlobalStylesId,
	};
}

/**
 * Returns an action object used in signalling that the theme base global styles have been received
 * Ignored from documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param stylesheet   The theme's identifier
 * @param globalStyles The global styles object.
 *
 * @return Action object.
 */
export function __experimentalReceiveThemeBaseGlobalStyles(
	stylesheet: string,
	globalStyles: object
): ActionOf< 'RECEIVE_THEME_GLOBAL_STYLES' > {
	return {
		type: 'RECEIVE_THEME_GLOBAL_STYLES',
		stylesheet,
		globalStyles,
	};
}

/**
 * Returns an action object used in signalling that the theme global styles variations have been received.
 * Ignored from documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param stylesheet The theme's identifier
 * @param variations The global styles variations.
 *
 * @return Action object.
 */
export function __experimentalReceiveThemeGlobalStyleVariations(
	stylesheet: string,
	variations: Array< unknown >
): ActionOf< 'RECEIVE_THEME_GLOBAL_STYLE_VARIATIONS' > {
	return {
		type: 'RECEIVE_THEME_GLOBAL_STYLE_VARIATIONS',
		stylesheet,
		variations,
	};
}

/**
 * Returns an action object used in signalling that the index has been received.
 *
 * @deprecated since WP 5.9, this is not useful anymore, use the selector directly.
 *
 * @return Action object.
 */
export function receiveThemeSupports(): { type: 'DO_NOTHING' } {
	deprecated( "wp.data.dispatch( 'core' ).receiveThemeSupports", {
		since: '5.9',
	} );

	return {
		type: 'DO_NOTHING',
	};
}

/**
 * Returns an action object used in signalling that the theme global styles CPT post revisions have been received.
 * Ignored from documentation as it's internal to the data store.
 *
 * @deprecated since WordPress 6.5.0. Callers should use `dispatch( 'core' ).receiveRevision` instead.
 *
 * @ignore
 *
 * @param      currentId The post id.
 * @param      revisions The global styles revisions.
 *
 * @return Action object.
 */
export function receiveThemeGlobalStyleRevisions(
	currentId: number,
	revisions: Array< object >
): ActionOf< 'RECEIVE_THEME_GLOBAL_STYLE_REVISIONS' > {
	deprecated(
		"wp.data.dispatch( 'core' ).receiveThemeGlobalStyleRevisions()",
		{
			since: '6.5.0',
			alternative: "wp.data.dispatch( 'core' ).receiveRevisions",
		}
	);
	return {
		type: 'RECEIVE_THEME_GLOBAL_STYLE_REVISIONS',
		currentId,
		revisions,
	};
}

/**
 * Returns an action object used in signalling that the preview data for
 * a given URl has been received.
 * Ignored from documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param url     URL to preview the embed for.
 * @param preview Preview data.
 *
 * @return Action object.
 */
export function receiveEmbedPreview(
	url: string,
	preview: unknown
): ActionOf< 'RECEIVE_EMBED_PREVIEW' > {
	return {
		type: 'RECEIVE_EMBED_PREVIEW',
		url,
		preview,
	};
}

/**
 * Action triggered to delete an entity record.
 *
 * @param kind                    Kind of the deleted entity.
 * @param name                    Name of the deleted entity.
 * @param recordId                Record ID of the deleted entity.
 * @param query                   Special query parameters for the
 *                                DELETE API call.
 * @param options                 Delete options.
 * @param options.__unstableFetch Internal use only. Function to
 *                                call instead of `apiFetch()`.
 *                                Must return a promise.
 * @param options.throwOnError    If false, this action suppresses all
 *                                the exceptions. Defaults to false.
 */
export const deleteEntityRecord =
	(
		kind: string,
		name: string,
		recordId: string | number,
		query?: Query | null,
		{
			__unstableFetch = apiFetch,
			throwOnError = false,
		}: DeleteEntityRecordOptions = {}
	) =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		logEntityDeprecation( kind, name, 'deleteEntityRecord' );
		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.kind === kind && config.name === name
		);
		let error: unknown;
		let deletedRecord: unknown = false;
		if ( ! entityConfig ) {
			return;
		}

		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[ 'entities', 'records', kind, name, recordId ],
			{ exclusive: true }
		);

		try {
			dispatch( {
				type: 'DELETE_ENTITY_RECORD_START',
				kind,
				name,
				recordId,
			} );

			let hasError = false;
			const { baseURL } = entityConfig;
			try {
				let path = `${ baseURL }/${ recordId }`;

				if ( query ) {
					path = addQueryArgs( path, query );
				}

				deletedRecord = await __unstableFetch( {
					path,
					method: 'DELETE',
				} );

				await dispatch( removeItems( kind, name, recordId, true ) );

				getEntitySyncManager()?.unload( kind, name, recordId );
			} catch ( _error ) {
				hasError = true;
				error = _error;
			}

			dispatch( {
				type: 'DELETE_ENTITY_RECORD_FINISH',
				kind,
				name,
				recordId,
				error,
			} );

			if ( hasError && throwOnError ) {
				throw error;
			}

			return deletedRecord;
		} finally {
			dispatch.__unstableReleaseStoreLock( lock );
		}
	};

/**
 * Returns an action object that triggers an
 * edit to an entity record.
 *
 * @param kind               Kind of the edited entity record.
 * @param name               Name of the edited entity record.
 * @param recordId           Pass `undefined` for keyless entities.
 * @param edits              The edits.
 * @param options            Options for the edit.
 * @param options.undoIgnore Whether to ignore the edit in undo history or not.
 * @param options.isCached   Whether the edit is transient (e.g. typing). Transient
 *                           edits are staged and eventually merged into the
 *                           preceding undo level instead of creating a new one.
 *
 * @return Action object.
 */
export const editEntityRecord =
	(
		kind: string,
		name: string,
		recordId: number | string | undefined,
		edits: object,
		{ undoIgnore, isCached }: EditEntityRecordOptions = {}
	) =>
	( { select, dispatch }: CoreDataThunkArgs ) => {
		logEntityDeprecation( kind, name, 'editEntityRecord' );
		// Edits are read by their fields' names.
		const fieldEdits = edits as Record< string, unknown >;
		const entityConfig = select.getEntityConfig( kind, name );
		if ( ! entityConfig ) {
			throw new Error(
				`The entity being edited (${ kind }, ${ name }) does not have a loaded config.`
			);
		}
		const { mergedEdits = {} } = entityConfig;
		const record = select.getRawEntityRecord( kind, name, recordId );
		// A missing record is `false`, whose fields read as `undefined`.
		const editedRecord = select.getEditedEntityRecord(
			kind,
			name,
			recordId
		) as unknown as Record< string, unknown >;

		// Some fields are merged with the existing value instead of replaced.
		// See `mergedEdits` definition on the entity config.
		const editsWithMerges = Object.keys( fieldEdits ).reduce<
			Record< string, unknown >
		>( ( acc, key ) => {
			acc[ key ] = mergedEdits[ key ]
				? {
						// Merged fields are objects, such as post meta.
						...( editedRecord[ key ] as object ),
						...( fieldEdits[ key ] as object ),
					}
				: fieldEdits[ key ];

			return acc;
		}, {} );

		const edit = {
			kind,
			name,
			recordId,
			// Clear edits when they are equal to their persisted counterparts
			// so that the property is not considered dirty.
			edits: clearUnchangedEdits( editsWithMerges, record ),
		};
		// Tell the entity sync manager about the edit before it arrives in the
		// store. It receives merged edits and the edit's intent, and decides
		// what to do with them.
		const syncManager = getEntitySyncManager();
		syncManager?.update(
			kind,
			name,
			// @ts-expect-error Bug: a keyless entity passes an `undefined` ID, which the sync manager's type excludes.
			recordId,
			editsWithMerges,
			{
				isCached: Boolean( isCached ),
				undoIgnore: Boolean( undoIgnore ),
			}
		);
		// A record the sync manager has loaded has its undo history tracked
		// by the manager, which reports each level it opens (see
		// `recordSyncUndoLevel`). Every other record is recorded here.
		if (
			! undoIgnore &&
			! syncManager?.isLoaded?.(
				kind,
				name,
				// @ts-expect-error Bug: a keyless entity passes an `undefined` ID, which the sync manager's type excludes.
				recordId
			)
		) {
			recordEntityEdit(
				select.getUndoManager(),
				syncManager,
				[
					{
						id: { kind, name, recordId },
						changes: Object.keys( fieldEdits ).reduce<
							Record< string, { from: unknown; to: unknown } >
						>( ( acc, key ) => {
							acc[ key ] = {
								from: editedRecord[ key ],
								to: fieldEdits[ key ],
							};
							return acc;
						}, {} ),
					},
				],
				isCached
			);
		}
		dispatch( {
			type: 'EDIT_ENTITY_RECORD',
			...edit,
		} );
	};

/**
 * Action triggered to clear all edits from
 * an entity record.
 *
 * @param kind     Kind of the entity.
 * @param name     Name of the entity.
 * @param recordId Is omitted for keyless entities.
 *
 * @return Action object.
 */
export const clearEntityRecordEdits =
	( kind: string, name: string, recordId?: number | string ) =>
	( { select, dispatch }: CoreDataThunkArgs ) => {
		const entityConfig = select.getEntityConfig( kind, name );
		logEntityDeprecation( kind, name, 'clearEntityRecordEdits' );
		if ( ! entityConfig ) {
			throw new Error(
				`The entity being edited (${ kind }, ${ name }) does not have a loaded config.`
			);
		}

		const currentEdits = select.getEntityRecordEdits(
			kind,
			name,
			recordId
		);
		if ( ! currentEdits ) {
			return;
		}

		// Build an edits object with all current edit keys set to undefined
		// so the reducer removes them.
		const clearedEdits = Object.keys( currentEdits ).reduce<
			Record< string, undefined >
		>( ( acc, key ) => {
			acc[ key ] = undefined;
			return acc;
		}, {} );

		dispatch( {
			type: 'EDIT_ENTITY_RECORD',
			kind,
			name,
			recordId,
			edits: clearedEdits,
		} );
	};

/**
 * Action triggered to undo the last edit to
 * an entity record, if any.
 */
export const undo =
	() =>
	( { select, dispatch }: CoreDataThunkArgs ) => {
		const undoRecord = applyUndoLevel(
			select.getUndoManager(),
			getEntitySyncManager(),
			'undo'
		);
		if ( ! undoRecord ) {
			return;
		}
		dispatch( {
			type: 'UNDO',
			record: undoRecord,
		} );
	};

/**
 * Action triggered to redo the last undone
 * edit to an entity record, if any.
 */
export const redo =
	() =>
	( { select, dispatch }: CoreDataThunkArgs ) => {
		const redoRecord = applyUndoLevel(
			select.getUndoManager(),
			getEntitySyncManager(),
			'redo'
		);
		if ( ! redoRecord ) {
			return;
		}
		dispatch( {
			type: 'REDO',
			record: redoRecord,
		} );
	};

/**
 * Forces the creation of a new undo level.
 *
 * @return Action object.
 */
export const __unstableCreateUndoLevel =
	() =>
	( { select }: CoreDataThunkArgs ) => {
		recordEntityEdit( select.getUndoManager(), getEntitySyncManager() );
	};

/**
 * Action triggered to save an entity record.
 *
 * @param kind                    Kind of the received entity.
 * @param name                    Name of the received entity.
 * @param record                  Record to be saved.
 * @param options                 Saving options.
 * @param options.isAutosave      Whether this is an autosave.
 * @param options.__unstableFetch Internal use only. Function to
 *                                call instead of `apiFetch()`.
 *                                Must return a promise.
 * @param options.throwOnError    If false, this action suppresses all
 *                                the exceptions. Defaults to false.
 */
export const saveEntityRecord =
	(
		kind: string,
		name: string,
		record: object,
		{
			isAutosave = false,
			__unstableFetch = apiFetch,
			throwOnError = false,
		}: SaveEntityRecordOptions = {}
	) =>
	async ( { select, resolveSelect, dispatch }: CoreDataThunkArgs ) => {
		logEntityDeprecation( kind, name, 'saveEntityRecord' );
		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.kind === kind && config.name === name
		);
		if ( ! entityConfig ) {
			return;
		}
		const entityIdKey = entityConfig.key ?? DEFAULT_ENTITY_KEY;
		// A record's key holds its ID, which a new record has none of.
		const recordId = ( record as Record< string, unknown > )[
			entityIdKey as string
		] as string | number | undefined;
		const isNewRecord = !! entityIdKey && ! recordId;

		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[ 'entities', 'records', kind, name, recordId || uuid() ],
			{ exclusive: true }
		);

		try {
			// Evaluate optimized edits.
			// (Function edits that should be evaluated on save to avoid expensive computations on every edit.)
			for ( const [ key, value ] of Object.entries( record ) ) {
				if ( typeof value === 'function' ) {
					const evaluatedValue = value(
						select.getEditedEntityRecord( kind, name, recordId )
					);
					dispatch.editEntityRecord(
						kind,
						name,
						recordId,
						{
							[ key ]: evaluatedValue,
						},
						{ undoIgnore: true }
					);
					// Fields are set by their name.
					( record as Record< string, unknown > )[ key ] =
						evaluatedValue;
				}
			}

			dispatch( {
				type: 'SAVE_ENTITY_RECORD_START',
				kind,
				name,
				recordId,
				isAutosave,
			} );
			let updatedRecord: RestRecord | undefined;
			let error: unknown;
			let hasError = false;
			const { baseURL } = entityConfig;
			try {
				const path = `${ baseURL }${ recordId ? '/' + recordId : '' }`;
				// Skip the raw values check when creating a new record; they don't exist yet.
				const persistedRecord = (
					! isNewRecord
						? select.getRawEntityRecord( kind, name, recordId )
						: {}
				) as RestRecord; // Fields are read by their name.

				// Let the entity sync manager see the edits about to be saved
				// and add anything it needs to the request. For example,
				// metadata about a shared document that should be saved with
				// the post.
				const syncManager = getEntitySyncManager();
				const syncEdits = isNewRecord
					? undefined
					: await syncManager?.beforeSave?.(
							kind,
							name,
							// @ts-expect-error Bug: a keyless entity passes an `undefined` ID, which the sync manager's type excludes.
							recordId,
							// Fields are read by their name.
							record as Record< string, unknown >,
							{ persistedRecord, isAutosave }
						);

				// Most of this autosave logic is very specific to posts.
				// This is fine for now as it is the only supported autosave,
				// but ideally this should all be handled in the back end,
				// so the client just sends and receives objects.
				if ( isAutosave ) {
					// Build the autosave payload from the persisted
					// record and the incoming edits. The previous autosave
					// is intentionally excluded to avoid stale values
					// overriding reverted fields.
					const merged = { ...persistedRecord, ...record };
					const data = [
						'title',
						'excerpt',
						'content',
						'meta',
					].reduce< Record< string, unknown > >(
						( acc, key ) => {
							if ( key in merged ) {
								acc[ key ] = merged[ key ];
							}
							return acc;
						},
						{
							// Do not update the `status` if we have edited it when auto saving.
							// It's very important to let the user explicitly save this change,
							// because it can lead to unexpected results. An example would be to
							// have a draft post and change the status to publish.
							status:
								merged.status === 'auto-draft'
									? 'draft'
									: undefined,
						}
					);
					// The REST API responds with the saved autosave.
					updatedRecord = ( await __unstableFetch( {
						path: `${ path }/autosaves`,
						method: 'POST',
						data: { ...data, ...syncEdits },
					} ) ) as RestRecord;

					// An autosave may be processed by the server as a regular save
					// when its update is requested by the author and the post had
					// draft or auto-draft status.
					if ( persistedRecord.id === updatedRecord.id ) {
						let newRecord: RestRecord = {
							...persistedRecord,
							...data,
							...updatedRecord,
						};
						newRecord = Object.keys(
							newRecord
						).reduce< RestRecord >( ( acc, key ) => {
							// These properties are persisted in autosaves.
							if (
								[
									'title',
									'excerpt',
									'content',
									'meta',
								].includes( key )
							) {
								acc[ key ] = newRecord[ key ];
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
								acc[ key ] = persistedRecord[ key ];
							}
							return acc;
						}, {} );
						dispatch.receiveEntityRecords(
							kind,
							name,
							newRecord,
							undefined,
							true
						);
					} else {
						dispatch.receiveAutosaves(
							// Posts have numeric IDs.
							persistedRecord.id as number,
							updatedRecord
						);
					}
				} else {
					let edits = { ...record, ...syncEdits };
					if ( entityConfig.__unstablePrePersist ) {
						edits = {
							...edits,
							...( await entityConfig.__unstablePrePersist(
								persistedRecord,
								edits
							) ),
						};
					}
					// The REST API responds with the saved record.
					updatedRecord = ( await __unstableFetch( {
						path,
						method: recordId ? 'PUT' : 'POST',
						data: edits,
					} ) ) as RestRecord;
					// Pass the original edits (before the sync manager and
					// `__unstablePrePersist` added to them) so the reducer
					// can clear the persisted edits from state.
					dispatch.receiveEntityRecords(
						kind,
						name,
						updatedRecord,
						undefined,
						true,
						// The saved edits are cleared by their fields' names.
						record as Record< string, unknown >
					);
					syncManager?.afterSave?.( kind, name, recordId, {
						savedRecord: updatedRecord,
						persistedRecord: isNewRecord
							? undefined
							: persistedRecord,
						// Fields are read by their name.
						edits: record as Record< string, unknown >,
					} );
				}
			} catch ( _error ) {
				hasError = true;
				error = _error;
			}
			dispatch( {
				type: 'SAVE_ENTITY_RECORD_FINISH',
				kind,
				name,
				recordId,
				error,
				isAutosave,
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
 * The `__experimentalBatch` action creator, whose results `dispatch` keeps.
 */
export interface ExperimentalBatch extends ActionCreatorWithCustomDispatchSignature {
	< Requests extends Array< BatchRequest > | [] >(
		requests: Requests
	): ( thunkArgs: CoreDataThunkArgs ) => Promise< BatchResults< Requests > >;

	DispatchSignature: < Requests extends Array< BatchRequest > | [] >(
		requests: Requests
	) => Promise< BatchResults< Requests > >;
}

/**
 * Runs multiple core-data actions at the same time using one API request.
 *
 * Example:
 *
 * ```
 * const [ savedRecord, updatedRecord, deletedRecord ] =
 *   await dispatch( 'core' ).__experimentalBatch( [
 *     ( { saveEntityRecord } ) => saveEntityRecord( 'root', 'widget', widget ),
 *     ( { saveEditedEntityRecord } ) => saveEntityRecord( 'root', 'widget', 123 ),
 *     ( { deleteEntityRecord } ) => deleteEntityRecord( 'root', 'widget', 123, null ),
 *   ] );
 * ```
 *
 * @param requests Array of functions which are invoked simultaneously.
 *                 Each function is passed an object containing
 *                 `saveEntityRecord`, `saveEditedEntityRecord`, and
 *                 `deleteEntityRecord`.
 *
 * @return A promise that resolves to an array containing the return
 *         values of each function given in `requests`.
 */
export const __experimentalBatch = ( <
		Requests extends Array< BatchRequest > | [],
	>(
		requests: Requests
	) =>
	async ( {
		dispatch,
	}: CoreDataThunkArgs ): Promise< BatchResults< Requests > > => {
		const batch = createBatch();
		const api: BatchActions = {
			saveEntityRecord( kind, name, record, options ) {
				return batch.add( ( add ) =>
					dispatch.saveEntityRecord( kind, name, record, {
						...options,
						__unstableFetch: add,
					} )
				);
			},
			saveEditedEntityRecord( kind, name, recordId, options ) {
				return batch.add( ( add ) =>
					dispatch.saveEditedEntityRecord( kind, name, recordId, {
						...options,
						__unstableFetch: add,
					} )
				);
			},
			deleteEntityRecord( kind, name, recordId, query, options ) {
				return batch.add( ( add ) =>
					dispatch.deleteEntityRecord( kind, name, recordId, query, {
						...options,
						__unstableFetch: add,
					} )
				);
			},
		};
		const resultPromises = requests.map( ( request ) => request( api ) );
		const [ , ...results ] = await Promise.all( [
			batch.run(),
			...resultPromises,
		] );
		// `Promise.all` keeps the order of the requests.
		return results as BatchResults< Requests >;
	} ) as ExperimentalBatch;

/**
 * Action triggered to save an entity record's edits.
 *
 * @param kind     Kind of the entity.
 * @param name     Name of the entity.
 * @param recordId Is omitted for keyless entities.
 * @param options  Saving options.
 */
export const saveEditedEntityRecord =
	(
		kind: string,
		name: string,
		recordId?: number | string,
		options?: SaveEntityRecordOptions
	) =>
	async ( { select, dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		logEntityDeprecation( kind, name, 'saveEditedEntityRecord' );
		if ( ! select.hasEditsForEntityRecord( kind, name, recordId ) ) {
			return;
		}
		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.kind === kind && config.name === name
		);
		if ( ! entityConfig ) {
			return;
		}
		const entityIdKey = entityConfig.key || DEFAULT_ENTITY_KEY;

		const edits = select.getEntityRecordNonTransientEdits(
			kind,
			name,
			recordId
		);
		const record = { [ entityIdKey ]: recordId, ...edits };
		return await dispatch.saveEntityRecord( kind, name, record, options );
	};

/**
 * Action triggered to save only specified properties for the entity.
 *
 * @param kind        Kind of the entity.
 * @param name        Name of the entity.
 * @param recordId    ID of the record.
 * @param itemsToSave List of entity properties or property paths to save.
 * @param options     Saving options.
 */
export const __experimentalSaveSpecifiedEntityEdits =
	(
		kind: string,
		name: string,
		recordId: number | string | undefined,
		itemsToSave: Array< string | Array< string > >,
		options?: SaveEntityRecordOptions
	) =>
	async ( { select, dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		logEntityDeprecation(
			kind,
			name,
			'__experimentalSaveSpecifiedEntityEdits'
		);
		if ( ! select.hasEditsForEntityRecord( kind, name, recordId ) ) {
			return;
		}
		const edits = select.getEntityRecordNonTransientEdits(
			kind,
			name,
			recordId
		);
		const editsToSave: Record< string, unknown > = {};

		for ( const item of itemsToSave ) {
			setNestedValue( editsToSave, item, getNestedValue( edits, item ) );
		}

		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.kind === kind && config.name === name
		);

		const entityIdKey = entityConfig?.key || DEFAULT_ENTITY_KEY;

		// If a record key is provided then update the existing record.
		// This necessitates providing `recordKey` to saveEntityRecord as part of the
		// `record` argument (here called `editsToSave`) to stop that action creating
		// a new record and instead cause it to update the existing record.
		if ( recordId ) {
			editsToSave[ entityIdKey ] = recordId;
		}
		return await dispatch.saveEntityRecord(
			kind,
			name,
			editsToSave,
			options
		);
	};

/**
 * Returns an action object used in signalling that Upload permissions have been received.
 *
 * @deprecated since WP 5.9, use receiveUserPermission instead.
 *
 * @param      hasUploadPermissions Does the user have permission to upload files?
 *
 * @return Action object.
 */
export function receiveUploadPermissions(
	hasUploadPermissions: boolean
): ActionOf< 'RECEIVE_USER_PERMISSION' > {
	deprecated( "wp.data.dispatch( 'core' ).receiveUploadPermissions", {
		since: '5.9',
		alternative: 'receiveUserPermission',
	} );

	return receiveUserPermission( 'create/media', hasUploadPermissions );
}

/**
 * Returns an action object used in signalling that the current user has
 * permission to perform an action on a REST resource.
 * Ignored from documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param key       A key that represents the action and REST resource.
 * @param isAllowed Whether or not the user can perform the action.
 *
 * @return Action object.
 */
export function receiveUserPermission(
	key: string,
	isAllowed: boolean
): ActionOf< 'RECEIVE_USER_PERMISSION' > {
	return {
		type: 'RECEIVE_USER_PERMISSION',
		key,
		isAllowed,
	};
}

/**
 * Returns an action object used in signalling that the current user has
 * permission to perform an action on a REST resource. Ignored from
 * documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param permissions An object where keys represent
 *                    actions and REST resources, and
 *                    values indicate whether the user
 *                    is allowed to perform the
 *                    action.
 *
 * @return Action object.
 */
export function receiveUserPermissions(
	permissions: Record< string, boolean >
): ActionOf< 'RECEIVE_USER_PERMISSIONS' > {
	return {
		type: 'RECEIVE_USER_PERMISSIONS',
		permissions,
	};
}

/**
 * Returns an action object used in signalling that the autosaves for a
 * post have been received.
 * Ignored from documentation as it's internal to the data store.
 *
 * @ignore
 *
 * @param postId    The id of the post that is parent to the autosave.
 * @param autosaves An array of autosaves or singular autosave object.
 *
 * @return Action object.
 */
export function receiveAutosaves(
	postId: number,
	autosaves: unknown | Array< unknown >
): ActionOf< 'RECEIVE_AUTOSAVES' > {
	return {
		type: 'RECEIVE_AUTOSAVES',
		postId,
		autosaves: Array.isArray( autosaves ) ? autosaves : [ autosaves ],
	};
}

/**
 * Returns an action object signalling that the fallback Navigation
 * Menu id has been received.
 *
 * @param fallbackId the id of the fallback Navigation Menu
 * @return Action object.
 */
export function receiveNavigationFallbackId(
	fallbackId: number | null | undefined
): ActionOf< 'RECEIVE_NAVIGATION_FALLBACK_ID' > {
	return {
		type: 'RECEIVE_NAVIGATION_FALLBACK_ID',
		fallbackId,
	};
}

/**
 * Returns an action object used to set the template for a given query.
 *
 * @param query      The lookup query.
 * @param templateId The resolved template id.
 *
 * @return Action object.
 */
export function receiveDefaultTemplateId(
	query: Query,
	templateId: string
): ActionOf< 'RECEIVE_DEFAULT_TEMPLATE' > {
	return {
		type: 'RECEIVE_DEFAULT_TEMPLATE',
		query,
		templateId,
	};
}

/**
 * Action triggered to receive revision items.
 *
 * @param kind            Kind of the received entity record revisions.
 * @param name            Name of the received entity record revisions.
 * @param recordKey       The key of the entity record whose revisions you want to fetch.
 * @param records         Revisions received.
 * @param query           Query Object.
 * @param invalidateCache Should invalidate query caches.
 * @param meta            Meta information about pagination.
 */
export const receiveRevisions =
	(
		kind: string,
		name: string,
		recordKey: number | string,
		records: object | Array< object >,
		query?: Query | null,
		invalidateCache: boolean | null = false,
		meta?: QueriedMeta | null
	) =>
	async ( { dispatch, resolveSelect }: CoreDataThunkArgs ) => {
		logEntityDeprecation( kind, name, 'receiveRevisions' );
		const configs: Array< EntityConfig > =
			await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.kind === kind && config.name === name
		);
		const key = entityConfig?.revisionKey ?? DEFAULT_ENTITY_KEY;

		dispatch( {
			type: 'RECEIVE_ITEM_REVISIONS',
			key,
			// Records are read by their fields' names.
			items: records as QueriedItem | Array< QueriedItem >,
			recordKey,
			meta,
			query,
			kind,
			name,
			invalidateCache,
		} );
	};
