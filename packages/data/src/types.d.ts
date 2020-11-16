export type WPDataFunctionOrGeneratorArray = {
    [index: number]: Function|Generator;
};
export type WPDataFunctionArray = {
    [index: number]: Function;
};

export type WPDataAttachedStore = {
    getSelectors: () => WPDataFunctionArray,
    getActions: () => WPDataFunctionArray,
    subscribe: (listener: () => void) => (() => void)
};

export type WPDataStoreDefinition = {
    /**
     * Store Name
     */
    name: string,

    /**
     * Store configuration object.
     */
    __internalAttach: (registry: WPDataRegistry) => WPDataAttachedStore,
};

export type WPDataReduxStoreConfig = {
    reducer: ( state: any, action: any ) => any,
    actions?: WPDataFunctionOrGeneratorArray,
    resolvers?: WPDataFunctionOrGeneratorArray,
    selectors?: WPDataFunctionArray,
    controls?: WPDataFunctionArray,
}

export type WPDataRegistry = {
    register: ( storeDefinition: WPDataStoreDefinition ) => void,
}