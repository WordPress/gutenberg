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
}

export interface SyncConfig {
	applyChangesToCRDTDoc: (
		ydoc: Y.Doc,
		changes: Partial< ObjectData >
	) => void;
	getChangesFromCRDTDoc: ( ydoc: Y.Doc ) => ObjectData;
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
