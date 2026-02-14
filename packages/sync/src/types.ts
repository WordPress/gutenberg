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
		__wpSyncEnabled?: string;
	}
}

export type CRDTDoc = Y.Doc;
export type AwarenessID = string;
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

export interface ProviderCreatorOptions {
	objectType: ObjectType;
	objectId: ObjectID | null;
	ydoc: Y.Doc;
	awareness?: Awareness;
}

export type ProviderCreator = (
	options: ProviderCreatorOptions
) => Promise< ProviderCreatorResult >;

export interface CollectionHandlers {
	refetchRecords: () => Promise< void >;
}

export interface SyncManagerUpdateOptions {
	isSave?: boolean;
	isNewUndoLevel?: boolean;
}

export interface RecordHandlers {
	addUndoMeta: ( ydoc: Y.Doc, meta: Map< string, any > ) => void;
	editRecord: (
		data: Partial< ObjectData >,
		options?: { undoIgnore?: boolean }
	) => void;
	getEditedRecord: () => Promise< ObjectData >;
	refetchRecord: () => Promise< void >;
	restoreUndoMeta: ( ydoc: Y.Doc, meta: Map< string, any > ) => void;
	saveRecord: () => Promise< void >;
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
	supports?: Record< string, true >;
}

export interface SyncManager {
	createMeta: (
		objectType: ObjectType,
		objectId: ObjectID
	) => Record< string, string >;
	getAwareness: < State extends Awareness >(
		objectType: ObjectType,
		objectId: ObjectID
	) => State | undefined;
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
		options?: SyncManagerUpdateOptions
	) => void;
}

export interface SyncUndoManager extends WPUndoManager< ObjectData > {
	addToScope: (
		ymap: Y.Map< any >,
		handlers: Pick< RecordHandlers, 'addUndoMeta' | 'restoreUndoMeta' >
	) => void;
	stopCapturing: () => void;
}
