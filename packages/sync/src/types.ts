/**
 * External dependencies
 */
import type * as Y from 'yjs';

export type * as Y from 'yjs';
export type ObjectID = string;
export type ObjectType = string;
export type ObjectData = object;
export type UndoManager = Y.UndoManager;

export type CRDTDoc = Y.Doc;

export type ConnectDocResult = {
	destroy: () => void;
};

export type ConnectDoc = (
	id: ObjectID,
	type: ObjectType,
	ydoc: Y.Doc
) => Promise< ConnectDocResult >;

export type SyncConfig = {
	applyChangesToDoc: ( ydoc: Y.Doc, data: Partial< ObjectData > ) => void;
	fromCRDTDoc: ( ydoc: Y.Doc ) => ObjectData;
	getObjectId: ( data: ObjectData ) => ObjectID;
	objectType: ObjectType;
};

export type SyncProvider = {
	__fallback?: boolean;
	bootstrap: (
		syncConfig: SyncConfig,
		initialData: ObjectData,
		handleChanges: ( data: Partial< ObjectData > ) => void
	) => Promise< void >;
	configs: Map< ObjectType, SyncConfig >;
	discard: ( type: ObjectType, id: ObjectID ) => void;
	update: (
		type: ObjectType,
		record: ObjectData,
		changes: Partial< ObjectData >,
		origin: string
	) => void;
};
