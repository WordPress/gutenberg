type MapOf< T > = { [ name: string ]: T };

export type ActionCreator = Function | Generator;
export type Resolver = Function | Generator;
export type Selector = Function;

export type AnyConfig = StoreConfig< any, any >;

export interface StoreInstance< Config extends AnyConfig > {
	getSelectors: () => SelectorsOf< Config >;
	getActions: () => ActionCreatorsOf< Config >;
	subscribe: ( listener: () => void ) => () => void;
}

export interface StoreDefinition< Config extends AnyConfig > {
	/**
	 * Store Name
	 */
	name: string;

	/**
	 * Creates a store instance
	 */
	instantiate: ( registry: DataRegistry ) => StoreInstance< Config >;
}

export interface StoreConfig<
	ActionCreators extends MapOf< ActionCreator >,
	Selectors extends MapOf< Selector >
> {
	reducer: ( state: any, action: any ) => any;
	actions?: ActionCreators;
	resolvers?: MapOf< Resolver >;
	selectors?: Selectors;
	controls?: MapOf< Function >;
}

export interface DataRegistry {
	register: ( store: StoreDefinition< any > ) => void;
}

export interface DataEmitter {
	emit: () => void;
	subscribe: ( listener: () => void ) => () => void;
	pause: () => void;
	resume: () => void;
	isPaused: boolean;
}

//
// Type Helpers
//

type ActionCreatorsOf< Config extends AnyConfig > = Config extends StoreConfig<
	infer ActionCreators,
	any
>
	? ActionCreators
	: never;

type SelectorsOf< Config extends AnyConfig > = Config extends StoreConfig<
	any,
	infer Selectors
>
	? Selectors
	: never;
