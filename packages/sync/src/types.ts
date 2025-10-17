/**
 * External dependencies
 */
import type * as Y from 'yjs';

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
export interface ObjectData extends Record< string, unknown > {}

export interface ProviderCreatorResult {
	destroy: () => void;
}

export type ProviderCreator = (
	objectType: ObjectType,
	objectId: ObjectID,
	ydoc: Y.Doc
) => Promise< ProviderCreatorResult >;

export interface RecordHandlers {
	editRecord: ( data: Partial< ObjectData > ) => void;
	getEditedRecord: () => Promise< ObjectData >;
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
	load: (
		syncConfig: SyncConfig,
		objectType: ObjectType,
		objectId: ObjectID,
		record: ObjectData,
		handlers: RecordHandlers
	) => Promise< void >;
	unload: ( objectType: ObjectType, objectId: ObjectID ) => void;
	update: (
		objectType: ObjectType,
		objectId: ObjectID,
		changes: Partial< ObjectData >,
		origin: string
	) => void;
}
