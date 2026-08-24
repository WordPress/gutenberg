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

/**
 * One open escalation in the review list: a parked edit that a user can
 * restore or discard. See prototypes/sync/PROPOSAL-REVIEW.md.
 */
export interface SyncReviewItem {
	/** The parked proposal's id (the escalated intent's intentId). */
	id: string;
	/** Groups rule-4 unit members (txnId, or the id for singletons). */
	unitId: string;
	/** Whether the current client authored the escalated edit. */
	isLocal: boolean;
	actorId: string;
	reason: string;
	intentType: string;
	/** The lost content, when the intent type carries any. */
	summary?: string;
	/** Target-field excerpt captured at escalation time. */
	excerpt?: string;
	/**
	 * The target block's engine identity (syncId), when the intent
	 * addresses one — lets UI anchor the conflict to a block in the
	 * editor. Absent for document-level intents (e.g. entity properties).
	 */
	targetId?: string;
	/**
	 * The target block's TOP-LEVEL index in the document, for engines
	 * whose review items address blocks positionally rather than by a
	 * persistent identity (e.g. de-rtc contests). A UI anchor of last
	 * resort: `targetId` wins when both are present.
	 */
	targetIndex?: number;
	/**
	 * For a parked NEW-block proposal (insert_block): the block it would
	 * create, its readable content, and where it would land — so the
	 * editor can render it inline at that position for approval (the block
	 * is not in the reviewer's canvas, so `targetId` cannot anchor it).
	 */
	proposedInsertion?: {
		blockType?: string;
		html: string;
		afterSiblingId?: string;
		parentId?: string;
	};
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
	/**
	 * Called when the sync engine sets an edit aside for review instead of
	 * merging it (an escalation). `isLocal` distinguishes the current
	 * client's own edit from a collaborator's; `proposalId` addresses the
	 * parked proposal for resolution, and `summary`/`excerpt` carry the
	 * lost content and its context for display. Fires only for OPEN
	 * proposals (a proposal resolved in the same delivery batch never
	 * notifies). Optional: managers fall back to console output.
	 */
	onEscalation?: ( escalation: {
		reason: string;
		isLocal: boolean;
		proposalId: string;
		summary?: string;
		excerpt?: string;
	} ) => void;

	/**
	 * Called with the full open-proposal review list whenever it changes
	 * (a proposal arrived or was resolved). Optional.
	 */
	onProposalsChange?: ( proposals: SyncReviewItem[] ) => void;
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
	/**
	 * Names a block type's rich-text attributes (backed by the block
	 * registry). Engines with rich-text-coordinate capture (the intent log)
	 * use it to decide which attributes become text fields; omitted, only
	 * the conventional `content` attribute is captured.
	 */
	richTextFields?: ( blockName: string ) => string[];
	/**
	 * Whether a block type keeps its markup in innerContent fragments
	 * rather than any attribute (core/html). Such blocks sync their full
	 * inner HTML as the engine's content field.
	 */
	isRawContentBlock?: ( blockName: string ) => boolean;
	/**
	 * The full inner HTML of a raw-content block (static fragments plus
	 * serialized inner blocks) — typically backed by the block
	 * serializer's getBlockContent.
	 */
	serializeRawContent?: ( block: {
		name: string;
		attributes: Record< string, unknown >;
		innerBlocks: unknown[];
		innerContent?: Array< string | null >;
	} ) => string;
	/**
	 * Where a raw-content block's HTML lives on the editor block:
	 * innerContent fragments (core/html) or attributes (core/freeform's
	 * raw-sourced content). Omitted, innerContent form is used.
	 */
	hydrateRawContent?: (
		blockName: string,
		html: string
	) => {
		attributes?: Record< string, unknown >;
		innerContent?: Array< string | null >;
	};
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
	/**
	 * Closes a parked proposal (engines with an escalation lane). The
	 * `restored` resolution is sent AFTER the caller re-authored the
	 * recovered content as ordinary edits.
	 */
	resolveProposal?: (
		objectType: ObjectType,
		objectId: ObjectID | null,
		proposalId: string,
		resolution: 'restored' | 'dismissed'
	) => void;
	/**
	 * Best-effort restore of a parked proposal's content as ordinary
	 * intents (text appends to the target field; attr/property writes
	 * re-apply at current versions), then resolves it as restored.
	 */
	restoreProposal?: (
		objectType: ObjectType,
		objectId: ObjectID | null,
		proposalId: string
	) => void;
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
