export type WPDataFunctionOrGeneratorArray = Array< Function | Generator >;
export type WPDataFunctionArray = Array< Function >;

export interface WPDataAttachedStore {
	getSelectors: () => WPDataFunctionArray;
	getActions: () => WPDataFunctionArray;
	subscribe: ( listener: () => void ) => () => void;
}

export interface WPDataStore {
	/**
	 * Store Name
	 */
	name: string;

	/**
	 * Store configuration object.
	 */
	instantiate: ( registry: WPDataRegistry ) => WPDataAttachedStore;
}

export interface WPDataReduxStoreConfig {
	reducer: ( state: any, action: any ) => any;
	actions?: WPDataFunctionOrGeneratorArray;
	resolvers?: WPDataFunctionOrGeneratorArray;
	selectors?: WPDataFunctionArray;
	controls?: WPDataFunctionArray;
}

export interface WPDataRegistry {
	register: ( store: WPDataStore ) => void;
}
