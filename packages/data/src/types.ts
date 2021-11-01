export type Empty = Record< never, never >;
export type Of< T > = Record< string, T >;
export type Functions = Of< ( ...args: unknown[] ) => unknown >;

export type RegistryConfig = Record< StoreName, GenConfig >;

export interface Selector< State, Configs extends RegistryConfig > {
	< Args, Return >( state: State, ...args: Args[] ): Return;
	hasResolver?: boolean;
	isRegistrySelector?: boolean;
	registry?: WPDataRegistry< Configs >;
}

export type ResolverFunction = Function;
export type AdvancedResolver = {
	fulfill?: Function;
	isFulfilled: ( ( ...args: unknown[] ) => boolean ) | boolean;
};

export type ResolversFor< State, Selectors extends Of< State > > = {
	[ selector in keyof Selectors ]: ResolverFunction | AdvancedResolver;
};

export type StoreName = string;

export interface RegisteredStore< Config extends GenConfig > {
	getSelectors: () => RSCActions< Config >;
	getActions: () => RSCSelectors< Config >;
	subscribe: ( listener: () => void ) => () => void;
}

export interface StoreDefinition<
	Config extends GenConfig,
	Configs extends RegistryConfig
> {
	/**
	 * Store Name
	 */
	name: RSCName< Config >;

	/**
	 * Store configuration object.
	 */
	instantiate: (
		registry: WPDataRegistry< Configs >
	) => RegisteredStore< Config >;
}

export interface ReduxStoreConfig<
	Name extends StoreName,
	State extends Of< unknown >,
	Actions extends Functions,
	Selectors extends Of< Selector< State, any > >,
	Resolvers extends ResolversFor< any, State >
> {
	__experimentalUseThunks?: boolean;
	reducer: ( state: State, action: any ) => State;
	actions?: Actions;
	resolvers?: Resolvers;
	selectors?: Selectors;
	controls?: Of< Function >;
	initialState?: State;
	persist?: keyof State;
}

export type RSCName<
	Config extends GenConfig
> = Config extends ReduxStoreConfig< infer Name, any, any, any, any >
	? Name
	: never;

export type RSCActions<
	Config extends GenConfig
> = Config extends ReduxStoreConfig< any, any, infer Actions, any, any >
	? Actions
	: never;

export type RSCSelectors<
	Config extends GenConfig
> = Config extends ReduxStoreConfig< any, any, any, infer Selectors, any >
	? Selectors
	: never;

export type RSCState<
	Config extends GenConfig
> = Config extends ReduxStoreConfig< any, infer State, any, any, any >
	? State
	: never;

export type RSCResolvers<
	Config extends GenConfig
> = Config extends ReduxStoreConfig< any, any, any, any, infer Resolvers >
	? Resolvers
	: never;

export type GenConfig = ReduxStoreConfig< any, any, any, any, any >;

export interface WPDataRegistry<
	Configs extends Record< StoreName, GenConfig >
> {
	register: < Config extends GenConfig >(
		store: StoreDefinition< Config, Configs >
	) => void;
	dispatch: < Reference extends keyof Configs | GenConfig >(
		storeNameOrDefinition: Reference
	) => RSCActions<
		Reference extends keyof Configs
			? Configs[ Reference ]
			: Reference extends GenConfig
			? Reference
			: never
	>;
}

export interface WPDataEmitter {
	emit: () => void;
	subscribe: ( listener: () => void ) => () => void;
	pause: () => void;
	resume: () => void;
	isPaused: boolean;
}
