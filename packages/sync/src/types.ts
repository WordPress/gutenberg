/**
 * External dependencies
 */
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

export type * as Y from 'yjs';
export type CRDTDoc = Y.Doc;
export type EntityID = string;
export type ObjectID = string;
export type ObjectType = string;
export type UndoManager = Y.UndoManager;

// Object data represents any entity record, post, term, user, site, etc. There
// are not many expectations that can hold on its shape, but defining some
// optional properties cuts down on the type narrowing.
export interface ObjectData extends Record< string, unknown > {
	meta?: Record< string, unknown >;
	status?: string;
}

export interface ConnectDocResult {
	awareness?: Awareness;
	destroy: () => void;
}

export type ConnectDoc = (
	id: ObjectID,
	type: ObjectType,
	ydoc: Y.Doc
) => Promise< ConnectDocResult >;

export type SyncConfig = {
	applyChangesToCRDTDoc: (
		ydoc: Y.Doc,
		data: Partial< ObjectData >,
		origin: string
	) => void;
	fromCRDTDoc: ( ydoc: Y.Doc ) => ObjectData;
	getInitialObjectData: ( record: ObjectData ) => ObjectData;
	getObjectId: ( data: ObjectData ) => ObjectID;
	objectType: ObjectType;
	supportsAwareness?: boolean;
	supportsUndo?: boolean;
};
