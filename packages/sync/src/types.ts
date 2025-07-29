/**
 * External dependencies
 */
import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';

export type * as Y from 'yjs';
export type ObjectID = string;
export type ObjectType = string;
export type ObjectData = object;
export type UndoManager = Y.UndoManager;

export type AwarenessClientID = number;

export type AwarenessEventListener = ( params: {
	added: AwarenessClientID[];
	updated: AwarenessClientID[];
	removed: AwarenessClientID[];
} ) => void;

export type AwarenessStates = Map<
	AwarenessClientID,
	Record< string, unknown >
>;

export type CRDTDoc = Y.Doc;

export type ConnectDocResult = {
	awareness: Awareness | null;
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

	awarenessManager?: {
		addListener: (
			eventType: 'update' | 'change',
			listener: AwarenessEventListener
		) => void;
		getStates: () => AwarenessStates;
		setLocalState: ( field: string, value: unknown ) => void;
		removeStates: () => void;
	};
};
