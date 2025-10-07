/**
 * External dependencies
 */
import type * as Y from 'yjs';

export type CRDTDoc = Y.Doc;
export type EntityID = string;
export type ObjectID = string;
export type ObjectType = string;

// Object data represents any entity record, post, term, user, site, etc. There
// are not many expectations that can hold on its shape.
export interface ObjectData extends Record< string, unknown > {}

export interface ConnectDocResult {
	destroy: () => void;
}

export type ConnectDoc = (
	id: ObjectID,
	type: ObjectType,
	ydoc: Y.Doc
) => Promise< ConnectDocResult >;

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
