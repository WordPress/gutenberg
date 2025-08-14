/**
 * External dependencies
 */
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

export type * as Y from 'yjs';
export type EntityID = string;
export type ObjectID = string;
export type ObjectType = string;
export type ObjectData = object;
export type UndoManager = Y.UndoManager;

export type CRDTDoc = Y.Doc;

export type ConnectDocResult = {
	awareness?: Awareness;
	destroy: () => void;
};

export type ConnectDoc = (
	id: ObjectID,
	type: ObjectType,
	ydoc: Y.Doc
) => Promise< ConnectDocResult >;

export type SyncConfig = {
	applyChangesToCRDTDoc: ( ydoc: Y.Doc, data: Partial< ObjectData > ) => void;
	fromCRDTDoc: ( ydoc: Y.Doc ) => ObjectData;
	getInitialObjectData: ( record: ObjectData ) => ObjectData;
	getObjectId: ( data: ObjectData ) => ObjectID;
	objectType: ObjectType;
	supportsAwareness?: boolean;
	supportsUndo?: boolean;
};
