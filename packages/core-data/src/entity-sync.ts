import type { UndoManager } from '@wordpress/undo-manager';
import warning from '@wordpress/warning';

/**
 * The entity sync interface.
 *
 * core-data knows nothing about how collaborative editing works. It offers
 * one registration point (registerEntitySyncManager) where a sync manager
 * can plug into the entity lifecycle. The registered manager receives
 * lifecycle events about records as they load, edits as they happen,
 * saves before and after they go out, and  unloads. Everything else
 * (documents, transports, presence, conflict handling, undo semantics) lives
 * inside of the manager.
 *
 * This is a private API (see `private-apis.ts`). Only one manager can be
 * registered at a time.
 */

export type EntitySyncRecord = Record< string, unknown >;

export type EntitySyncRecordId = string | number;

/**
 * Describes the intent behind an edit passed to `update`.
 *
 * In Gutenberg, block changes flow through two callbacks: `onInput` for
 * transient, in-progress changes (typing each character), which use
 * `isCached: true`, and `onChange` for completed changes (formatting,
 * block insertions), which use `isCached: false`. `undoIgnore: true` means
 * the change must not affect undo history at all (for example selection-only
 * changes).
 */
export interface EntitySyncEditOptions {
	isCached: boolean;
	undoIgnore: boolean;
}

export interface EntitySyncUndoStackState {
	hasUndo: boolean;
	hasRedo: boolean;
}

/**
 * What a manager can ask core-data to do for one loaded record.
 */
export interface EntitySyncRecordHandlers {
	/**
	 * Applies edits that originate from the manager (remote changes, undo)
	 * to the entity record without recording them in the undo history.
	 */
	editRecord: (
		edits: EntitySyncRecord,
		options?: { undoIgnore?: boolean }
	) => void;

	/** The current record with its unsaved edits applied. */
	getEditedRecord: () => Promise< EntitySyncRecord >;

	/** Refetches the record from the REST API. */
	refetchRecord: () => Promise< void >;

	/**
	 * Tells core-data that the manager's undo stack changed, so `hasUndo`
	 * and `hasRedo` reflect it.
	 */
	onUndoStackChange: ( state: EntitySyncUndoStackState ) => void;
}

/**
 * What a manager can ask core-data to do for a loaded collection.
 */
export interface EntitySyncCollectionHandlers {
	/** Refetches the whole collection from the REST API. */
	refetchRecords: () => Promise< void >;
}

export interface EntitySyncBeforeSaveContext {
	/**
	 * The record as last received from the server, or undefined when it
	 * is not in the store.
	 */
	persistedRecord?: EntitySyncRecord;
	isAutosave: boolean;
}

export interface EntitySyncAfterSaveContext {
	/** The raw save response. */
	savedRecord: EntitySyncRecord;

	/**
	 * The record as it was before the save, or undefined for a new record
	 * or one that was not in the store.
	 */
	persistedRecord?: EntitySyncRecord;

	/** The edits that were sent. */
	edits: EntitySyncRecord;
}

/**
 * An undo manager a sync manager substitutes for core-data's own while
 * synced records are loaded.
 */
export interface EntitySyncUndoManager extends UndoManager< EntitySyncRecord > {
	/**
	 * Closes the current undo level so the next change starts a new one.
	 */
	stopCapturing?: () => void;
}

export interface EntitySyncManager {
	/**
	 * Optional check that runs before a record is loaded. When this returns
	 * false for a record, core-data does not call `load` for it and skips
	 * the transient reads it would otherwise do for a synced record.
	 *
	 * Only `load` is gated. `loadCollection`, `update`, `beforeSave`,
	 * `afterSave`, and `unload` are still called for every record, so a
	 * manager that syncs only some entities must check for itself inside
	 * those members.
	 */
	shouldSync?: (
		kind: string,
		name: string,
		recordId: EntitySyncRecordId
	) => boolean;

	/**
	 * Called once when a single record is fetched by numeric id, right after
	 * it arrives from the REST API. Records fetched with a query do not
	 * trigger it. The record already has its transient properties filled
	 * in, for example the parsed `blocks` of a post.
	 *
	 * This is where a manager starts syncing the record. The handlers let it
	 * write back into the store later: e.g. `editRecord` applies edits that
	 * came from somewhere else, `refetchRecord` reloads the record from the
	 * server.
	 */
	load: (
		kind: string,
		name: string,
		recordId: EntitySyncRecordId,
		record: EntitySyncRecord,
		handlers: EntitySyncRecordHandlers
	) => void | Promise< void >;

	/**
	 * Called when a whole collection is fetched (`per_page: -1`).
	 */
	loadCollection?: (
		kind: string,
		name: string,
		handlers: EntitySyncCollectionHandlers
	) => void | Promise< void >;

	/**
	 * Called for every `editEntityRecord`, BEFORE the edit reaches the
	 * store. The edits already have merged fields applied
	 * (see `mergedEdits` on the entity config).
	 *
	 * Known ordering: a manager that calls `editRecord` synchronously from
	 * here has its edit overwritten by the store update that follows.
	 * Dispatch such edits from a later task.
	 */
	update: (
		kind: string,
		name: string,
		recordId: EntitySyncRecordId,
		edits: EntitySyncRecord,
		options: EntitySyncEditOptions
	) => void;

	/**
	 * Called right before a save request goes out for an existing record,
	 * with the edits about to be saved.
	 *
	 * This is the place to add sync-related data to the request. Any
	 * object returned here is merged over the edits, so the manager can
	 * add fields or override existing ones.
	 */
	beforeSave?: (
		kind: string,
		name: string,
		recordId: EntitySyncRecordId,
		edits: EntitySyncRecord,
		context: EntitySyncBeforeSaveContext
	) => EntitySyncRecord | void | Promise< EntitySyncRecord | void >;

	/**
	 * Called after a regular (non-autosave) save succeeded and the response
	 * was received into the store. `recordId` is the id the save was
	 * called with, so it is undefined for a record that was just created.
	 * Read the new id from `context.savedRecord` in that case.
	 */
	afterSave?: (
		kind: string,
		name: string,
		recordId: EntitySyncRecordId | undefined,
		context: EntitySyncAfterSaveContext
	) => void;

	/**
	 * Called after `deleteEntityRecord` removed a record from the store,
	 * once the delete request succeeded. The manager should stop syncing
	 * that record and release anything it holds for it.
	 */
	unload: (
		kind: string,
		name: string,
		recordId: EntitySyncRecordId
	) => void;

	/**
	 * Called when collaboration support is switched off. The manager should
	 * stop syncing every record it holds and release its resources.
	 */
	unloadAll: () => void;

	/**
	 * When set, replaces core-data's undo manager. `hasUndo`/`hasRedo`
	 * then reflect the state reported through `onUndoStackChange`.
	 */
	readonly undoManager?: EntitySyncUndoManager;
}

let registeredManager: EntitySyncManager | undefined;

/**
 * Registers the entity sync manager. Only one can be active: registering
 * a second one replaces the first. Callers that want to cooperate should
 * check `getEntitySyncManager()` first and back off when one exists.
 *
 * @param manager The manager to register.
 * @return A function that unregisters this manager (a no-op if another
 *         manager has replaced it since).
 */
export function registerEntitySyncManager(
	manager: EntitySyncManager
): () => void {
	if ( registeredManager && registeredManager !== manager ) {
		warning(
			'registerEntitySyncManager: an entity sync manager was already registered and has been replaced.'
		);
	}

	registeredManager = manager;

	return () => {
		if ( registeredManager === manager ) {
			registeredManager = undefined;
		}
	};
}

/**
 * Returns the registered entity sync manager, if any.
 *
 * @return The manager, or undefined when none is registered.
 */
export function getEntitySyncManager(): EntitySyncManager | undefined {
	return registeredManager;
}
