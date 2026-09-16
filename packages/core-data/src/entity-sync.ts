import type { UndoManager } from '@wordpress/undo-manager';
import warning from '@wordpress/warning';

/**
 * The entity sync seam.
 *
 * core-data knows nothing about how collaborative editing works: it only
 * offers ONE registration point where a sync manager can plug into the
 * entity lifecycle. The registered manager hears about records as they
 * load, edits as they happen, saves before and after they go out, and
 * unloads. Everything else (documents, transports, presence, conflict
 * handling, undo semantics) lives behind the manager.
 *
 * This is a private API (see `private-apis.ts`). Exactly one manager can be
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
	 * to the entity record WITHOUT recording them in the entity undo
	 * history.
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
	 * Optional early-out. When it returns false for a record, core-data
	 * skips the load path entirely (including the transient reads it does
	 * for synced records).
	 */
	shouldSync?: (
		kind: string,
		name: string,
		recordId: EntitySyncRecordId
	) => boolean;

	/**
	 * Called once per numeric-id record fetched without a query, with the
	 * record as received (transient properties filled in). The manager
	 * decides whether the entity is synced; it should ignore later calls
	 * for entities it did not load.
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
	 * Called before a save request is sent for an existing record, with the
	 * edits about to be saved. A returned object is merged into the request
	 * payload.
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
	 * was received into the store. `recordId` is undefined for a record
	 * that was just created.
	 */
	afterSave?: (
		kind: string,
		name: string,
		recordId: EntitySyncRecordId | undefined,
		context: EntitySyncAfterSaveContext
	) => void;

	/** Called after a record was deleted. */
	unload: (
		kind: string,
		name: string,
		recordId: EntitySyncRecordId
	) => void;

	/** Stops syncing everything. */
	unloadAll: () => void;

	/**
	 * When set, replaces core-data's undo manager; `hasUndo`/`hasRedo`
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
