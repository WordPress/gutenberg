/**
 * External dependencies
 */
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

export type CRDTDoc = Y.Doc;
export type EntityID = string;
export type ObjectID = string;
export type ObjectType = string;

// Object data represents any entity record, post, term, user, site, etc. There
// are not many expectations that can hold on its shape.
export interface ObjectData extends Record< string, unknown > {}

export interface ConnectDocResult {
	awareness?: Awareness;
	destroy: () => void;
}

export type ConnectDoc = (
	id: ObjectID,
	type: ObjectType,
	ydoc: Y.Doc
) => Promise< ConnectDocResult >;

export interface RecordHandlers {
	editRecord: ( data: Partial< ObjectData > ) => void;
	getEditedRecord: () => Promise< ObjectData >;
	refetchPersistedRecord: () => void;
}

export interface SyncConfig {
	applyChangesToCRDTDoc: (
		ydoc: Y.Doc,
		changes: Partial< ObjectData >,
		rawRecord: ObjectData,
		origin: string
	) => void;
	getChangesFromCRDTDoc: ( ydoc: Y.Doc, record: ObjectData ) => ObjectData;
	getInitialObjectData: ( record: ObjectData ) => ObjectData;
	getObjectId: ( data: ObjectData ) => ObjectID;
	objectType: ObjectType;
	supports?: {
		awareness?: boolean;
		crdtPersistence?: boolean;
		undo?: boolean;
	};
	syncedProperties: Set< string >;
}
