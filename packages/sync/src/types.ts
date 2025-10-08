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

export type ConnectDoc = (
	id: ObjectID,
	type: ObjectType,
	doc: CRDTDoc
) => Promise< () => void >;

export interface SyncConfig {
	applyChangesToCRDTDoc: (
		ydoc: Y.Doc,
		changes: Partial< ObjectData >
	) => void;
	getChangesFromCRDTDoc: ( ydoc: Y.Doc ) => ObjectData;
	supports: Record< string, true >;
}

export type SyncProvider = {
	register: ( type: ObjectType, config: SyncConfig ) => void;
	bootstrap: (
		type: ObjectType,
		objectId: ObjectID,
		record: ObjectData,
		handleChanges: ( data: any ) => void
	) => Promise< void >;
	update: ( type: ObjectType, id: ObjectID, data: any ) => void;
	discard: ( type: ObjectType, id: ObjectID ) => Promise< void >;
};
