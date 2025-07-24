/**
 * External dependencies
 */
import type * as Y from 'yjs';

declare global {
	interface Window {
		__experimentalCollaborativeEditingSecret?: string;
		wp: {
			ajax: {
				settings: {
					url: string;
				};
			};
		};
	}
}

export type ObjectID = string;
export type ObjectType = string;
export type CRDTDoc = Y.Doc;

export type ObjectConfig = {
	applyChangesToDoc: ( doc: CRDTDoc, data: object ) => void;
	fetch: ( id: ObjectID ) => Promise< object >;
	fromCRDTDoc: ( doc: CRDTDoc ) => any;
};

export type ConnectDoc = (
	id: ObjectID,
	type: ObjectType,
	doc: CRDTDoc
) => Promise< () => void >;

export type SyncProvider = {
	bootstrap: (
		type: ObjectType,
		id: ObjectID,
		handleChanges: ( data: object ) => void
	) => Promise< void >;
	discard: ( type: ObjectType, id: ObjectID ) => Promise< void >;
	update: ( type: ObjectType, id: ObjectID, data: object ) => void;
};
