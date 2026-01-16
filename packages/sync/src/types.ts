/**
 * WordPress dependencies
 */
import type { UndoManager as WPUndoManager } from '@wordpress/undo-manager';

/**
 * External dependencies
 */
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import type { WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE } from './config';

/* globalThis */
declare global {
	interface Window {
		__experimentalCollaborativeEditingSecret?: string;
		wp?: {
			ajax?: {
				settings?: {
					url?: string;
				};
			};
		};
	}
}

export type CRDTDoc = Y.Doc;
export type EntityID = string;
export type ObjectID = string;
export type ObjectType = string;

// An origin is a value passed by the transactor to identify the source of a
// change. It can be any value, and is not used internally by Yjs. Origins are
// preserved locally, while a remote change will have the provider instance as
// its origin.
export type Origin = any;

// Object data represents any entity record, post, term, user, site, etc. There
// are not many expectations that can hold on its shape.
export interface ObjectData extends Record< string, unknown > {
	meta?: ObjectMeta;
}

export interface ObjectMeta extends Record< string, unknown > {
	[ WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]?: string;
}

export interface ProviderCreatorResult {
	destroy: () => void;
}

export type SyncConnectionStatus = 'connected' | 'disconnected';

/**
 * Sync connection error object.
 */
export interface SyncConnectionError {
	/**
	 * Error code identifier for programmatic handling and default message lookup.
	 */
	code: string;

	/**
	 * Short error title/message to display in UI.
	 * If not provided, UI components will use a default based on the code.
	 */
	message?: string;

	/**
	 * Longer error description for display.
	 * If not provided, UI components will use a default based on the code.
	 */
	description?: string;
}

export interface SyncConnectionState {
	status: SyncConnectionStatus;

	/**
	 * Error information when status is 'disconnected'.
	 */
	error?: SyncConnectionError;
}

export type OnStateChangeCallback = ( state: SyncConnectionState ) => void;

export interface ProviderCreatorOptions {
	objectType: ObjectType;
	objectId: ObjectID | null;
	ydoc: Y.Doc;
	awareness?: Awareness;
	/**
	 * Callback to report connection state changes.
	 *
	 * Providers should call this when connection status changes.
	 *
	 * Example usage in providers:
	 *
	 * ```js
	 * // Report disconnection with a standard error code
	 * onStateChange({
	 *   status: 'disconnected',
	 *   error: {
	 *     code: 'too-many-connections'
	 *   }
	 * });
	 *
	 * // Report disconnection with custom messages
	 * onStateChange({
	 *   status: 'disconnected',
	 *   error: {
	 *     code: 'rate-limited',
	 *     message: 'Too Many Requests',
	 *     description: 'You have made too many requests. Please try again in 5 minutes.'
	 *   }
	 * });
	 *
	 * // Report successful connection
	 * onStateChange({ status: 'connected' });
	 * ```
	 */
	onStateChange: OnStateChangeCallback;
}

export type ProviderCreator = (
	options: ProviderCreatorOptions
) => Promise< ProviderCreatorResult >;

export interface CollectionHandlers {
	refetchRecords: () => Promise< void >;
	onStateChange: OnStateChangeCallback;
}

export interface RecordHandlers {
	addUndoMeta: ( ydoc: Y.Doc, meta: Map< string, any > ) => void;
	editRecord: ( data: Partial< ObjectData > ) => void;
	getEditedRecord: () => Promise< ObjectData >;
	onStateChange: OnStateChangeCallback;
	refetchRecord: () => Promise< void >;
	restoreUndoMeta: ( ydoc: Y.Doc, meta: Map< string, any > ) => void;
	saveRecord: () => Promise< void >;
}

export interface SyncConfig {
	applyChangesToCRDTDoc: (
		ydoc: Y.Doc,
		changes: Partial< ObjectData >
	) => void;
	getChangesFromCRDTDoc: (
		ydoc: Y.Doc,
		editedRecord: ObjectData
	) => ObjectData;
	supports?: Record< string, true >;
}

export interface SyncManager {
	createMeta: (
		objectType: ObjectType,
		objectId: ObjectID
	) => Record< string, string >;
	load: (
		syncConfig: SyncConfig,
		objectType: ObjectType,
		objectId: ObjectID,
		record: ObjectData,
		handlers: RecordHandlers
	) => Promise< void >;
	loadCollection: (
		syncConfig: SyncConfig,
		objectType: ObjectType,
		handlers: CollectionHandlers
	) => Promise< void >;
	// undoManager is undefined until the first entity is loaded.
	undoManager: SyncUndoManager | undefined;
	unload: ( objectType: ObjectType, objectId: ObjectID ) => void;
	update: (
		objectType: ObjectType,
		objectId: ObjectID | null,
		changes: Partial< ObjectData >,
		origin: string,
		isSave?: boolean
	) => void;
}

export interface SyncUndoManager extends WPUndoManager< ObjectData > {
	addToScope: (
		ymap: Y.Map< any >,
		handlers: Pick< RecordHandlers, 'addUndoMeta' | 'restoreUndoMeta' >
	) => void;
}
