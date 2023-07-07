export type ObjectID = string;
export type ObjectType = string;
export type ObjectData = any;
export type CRDTDoc = any;

export type ObjectConfig = {
	fetch: ( id: ObjectID ) => Promise< ObjectData >;
	applyChangesToDoc: ( doc: CRDTDoc, data: any ) => void;
	fromCRDTDoc: ( doc: CRDTDoc ) => any;
};

export type ConnectDoc = (
	id: ObjectID,
	type: ObjectType,
	doc: CRDTDoc
) => Promise< () => void >;

export type SyncProvider = {
	register: ( type: ObjectType, config: ObjectConfig ) => void;
	bootstrap: (
		type: ObjectType,
		id: ObjectID,
		handleChanges: ( data: any ) => void
	) => Promise< CRDTDoc >;
	discard: ( type: ObjectType, id: ObjectID ) => Promise< CRDTDoc >;
};
