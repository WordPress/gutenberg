import type { UndoManager as WPUndoManager } from '@wordpress/undo-manager';
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import type { EngineSessionCodec } from './engines/session';
import type { ConnectionError } from './errors';

/* globalThis */
declare global {
	interface Window {
		__experimentalEnableRealTimeCollaboration?: boolean;
		_wpCollaborationUserId?: number;
		_wpCollaborationWebSocketUrl?: string;
		_wpCollaborationSync?: {
			engine?: string;
			engineProtocol?: number;
			transports?: string[];
			transportProtocol?: number;
		};
	}
}

export type CRDTDoc = Y.Doc;
export type EntityID = string;
export type ObjectID = string;
export type ObjectType = string;

// Object data represents any entity record. There are not any expectations that
// can hold on its shape, beyond a record with string keys and unknown values.
export type ObjectData = Record< string, unknown >;

/**
 * Event map for provider events.
 * Add new event types here as needed.
 */
export interface ProviderEventMap {
	status: ConnectionStatus;
}

/**
 * Generic event listener type for providers.
 * Providers should call registered callbacks when events occur like connection status changes.
 * Providers are responsible for cleaning up listeners in their destroy() method.
 */
export type ProviderOn = < K extends keyof ProviderEventMap >(
	event: K,
	callback: ( data: ProviderEventMap[ K ] ) => void
) => void;

export interface ProviderCreatorResult {
	destroy: () => void;
	on: ProviderOn;
	/**
	 * Best-effort: reconnect / poll immediately after a connection error.
	 * Called by the manager's `retry()` (driven by the editor's connection-
	 * error UI). Optional — transports without an explicit retry are skipped.
	 */
	retry?: () => void;
}

/**
 * Current connection status of a sync provider.
 */
export interface ConnectionStatusConnected {
	status: 'connected';
}

export interface ConnectionStatusConnecting {
	status: 'connecting';
}

export interface ConnectionStatusDisconnected {
	status: 'disconnected';

	/** Optional error information. */
	error?: ConnectionError;

	/** Whether the error condition is retryable via user action. */
	canManuallyRetry?: boolean;

	/** Number of consecutive poll failures since the last successful connection. */
	consecutiveFailures?: number;

	/** Whether the background retry schedule has been exhausted without a successful connection. */
	backgroundRetriesFailed?: boolean;

	/** Milliseconds until the next automatic retry attempt (triggered by the provider). */
	willAutoRetryInMs?: number;
}

export type ConnectionStatus =
	| ConnectionStatusConnected
	| ConnectionStatusConnecting
	| ConnectionStatusDisconnected;

export type OnStatusChangeCallback = (
	status: ConnectionStatus | null
) => void;

/**
 * Options passed to a provider creator function when initializing a sync
 * provider. Providers receive an engine session codec — never the engine's
 * internal state (e.g. a Y.Doc) — so transports stay engine-agnostic.
 */
export interface ProviderCreatorOptions {
	objectType: ObjectType;
	objectId: ObjectID | null;
	session: EngineSessionCodec;
}

export type ProviderCreator = (
	options: ProviderCreatorOptions
) => Promise< ProviderCreatorResult >;

export interface CollectionHandlers {
	onStatusChange: OnStatusChangeCallback;
	refetchRecords: () => Promise< void >;
}

export interface SyncManagerUpdateOptions {
	// Whether this update represents a user-facing entity save.
	isSave?: boolean;
	isNewUndoLevel?: boolean;
}

export interface SyncUndoStackState {
	hasRedo: boolean;
	hasUndo: boolean;
}

export interface RecordHandlers {
	addUndoMeta: ( ydoc: Y.Doc, meta: Map< string, any > ) => void;
	editRecord: (
		data: Partial< ObjectData >,
		options?: { undoIgnore?: boolean }
	) => void;
	getEditedRecord: () => Promise< ObjectData >;
	onStatusChange: OnStatusChangeCallback;
	persistCRDTDoc: () => void;
	refetchRecord: () => Promise< void >;
	restoreUndoMeta: ( ydoc: Y.Doc, meta: Map< string, any > ) => void;
	onUndoStackChange?: ( state: SyncUndoStackState ) => void;
}

export interface SyncConfig {
	applyChangesToCRDTDoc: (
		ydoc: Y.Doc,
		changes: Partial< ObjectData >
	) => void;
	createAwareness?: (
		ydoc: Y.Doc,
		objectId?: ObjectID
	) => Awareness | undefined;
	getChangesFromCRDTDoc: (
		ydoc: Y.Doc,
		editedRecord: ObjectData
	) => ObjectData;
	getPersistedCRDTDoc?: ( record: ObjectData ) => string | null;
	shouldSync?: (
		objectType: ObjectType,
		objectId: ObjectID | null
	) => boolean;
	supportsPersistence?: boolean;
}

export interface SyncManager {
	createPersistedCRDTDoc: (
		objectType: ObjectType,
		objectId: ObjectID
	) => Promise< string | null >;
	getAwareness: < State extends Awareness >(
		objectType: ObjectType,
		objectId: ObjectID | null
	) => State | undefined;
	getEntitySnapshot: (
		objectType: ObjectType,
		objectId: ObjectID
	) => string | undefined;
	entityContainsSnapshot: (
		objectType: ObjectType,
		objectId: ObjectID,
		encodedSnapshot: string
	) => boolean;
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
	unloadAll: () => void;
	/**
	 * Retries the active connection(s) after a connection error — the
	 * transport-agnostic replacement for reaching into a specific transport.
	 * Best-effort: it asks every live provider to retry (see
	 * `ProviderCreatorResult.retry`). Wired to the editor's connection-error
	 * modal through `core-data`'s `retrySyncConnection`.
	 */
	retry?: () => void;
	update: (
		objectType: ObjectType,
		objectId: ObjectID | null,
		changes: Partial< ObjectData >,
		origin: string,
		options?: SyncManagerUpdateOptions
	) => void;
}

export interface SyncUndoManager extends WPUndoManager< ObjectData > {
	addToScope: (
		ymap: Y.Map< any >,
		handlers: Pick<
			RecordHandlers,
			'addUndoMeta' | 'restoreUndoMeta' | 'onUndoStackChange'
		>
	) => void;
	stopCapturing: () => void;
}
