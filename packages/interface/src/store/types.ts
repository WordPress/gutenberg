export type StoreState = {
	complementaryAreas: Record< string, string >;
	activeModal: string | null;
};

export type SetDefaultComplementaryAreaAction = {
	type: 'SET_DEFAULT_COMPLEMENTARY_AREA';
	scope: string;
	area: string;
};

export type EnableComplementaryAreaAction = {
	type: 'ENABLE_COMPLEMENTARY_AREA';
	scope: string;
	area: string;
};

export type OpenModalAction = {
	type: 'OPEN_MODAL';
	name: string;
};

export type CloseModalAction = {
	type: 'CLOSE_MODAL';
};

export type Action =
	| SetDefaultComplementaryAreaAction
	| EnableComplementaryAreaAction
	| OpenModalAction
	| CloseModalAction;
