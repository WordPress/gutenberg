type MapOf< T > = { [ name: string ]: T };

export type ActionCreator = Function | Generator;
export type Resolver = Function | Generator;
export type Selector = Function;

export type AnyConfig = ReduxStoreConfig< any, any, any >;

export interface StoreInstance< Config extends AnyConfig > {
	getSelectors: () => SelectorsOf< Config >;
	getActions: () => ActionCreatorsOf< Config >;
	subscribe: ( listener: () => void ) => () => void;
}

export interface StoreDescriptor< Config extends AnyConfig > {
	/**
	 * Store Name
	 */
	name: string;

	/**
	 * Creates a store instance
	 */
	instantiate: ( registry: DataRegistry ) => StoreInstance< Config >;
}

export interface ReduxStoreConfig<
	State,
	ActionCreators, // extends MapOf< ActionCreator >,
	Selectors // extends MapOf< Selector >
> {
	initialState?: State;
	reducer: ( state: any, action: any ) => any;
	actions?: ActionCreators;
	resolvers?: MapOf< Resolver >;
	selectors?: Selectors;
	controls?: MapOf< Function >;
}

export type UseSelect = < F extends MapSelect | StoreDescriptor< any > >(
	mapSelect: F,
	deps?: any[]
) => F extends StoreDescriptor< any >
	? GetSelectorsOf< F >
	: F extends MapSelect
	? ReturnType< F >
	: never;

export type UseSelectReturn<
	F extends MapSelect | StoreDescriptor< any >
> = F extends MapSelect
	? ReturnType< F >
	: F extends StoreDescriptor< any >
	? GetSelectorsOf< F >
	: never;
export type MapSelect = ( select: SelectFunction ) => any;

export type SelectFunction = < Descriptor >(
	store: Descriptor
) => GetSelectorsOf< Descriptor >;

export type GetSelectorsOf< Descriptor > = Descriptor extends StoreDescriptor<
	ReduxStoreConfig< infer X, any, infer S >
>
	? S
	: never;

/*

 */
// Test {{{
const useSelect = {} as UseSelect;
export type CoreStore = StoreDescriptor<
	ReduxStoreConfig<
		{ lorem: 'ipsum' },
		any,
		{ getEntityRecord: ( name: string ) => 123 }
	>
>;
const store: CoreStore = {} as any;
export function PretendedReactComponent() {
	const selectors = useSelect( store );
	// Selectors reflect the CoreStore's selecots
	const nb123 = useSelect( ( select ) => {
		const number = select( store ).getEntityRecord( 'a' );
		return number;
	} );
	// nb123 is a number 123
	return { selectors, nb123 };
}
// }}

export interface DataRegistry {
	register: ( store: StoreDescriptor< any > ) => void;
}

export interface DataEmitter {
	emit: () => void;
	subscribe: ( listener: () => void ) => () => void;
	pause: () => void;
	resume: () => void;
	isPaused: boolean;
}

// Type Helpers.

type ActionCreatorsOf<
	Config extends AnyConfig
> = Config extends ReduxStoreConfig< any, infer ActionCreators, any >
	? { [ name in keyof ActionCreators ]: Function | Generator }
	: never;

type SelectorsOf< Config extends AnyConfig > = Config extends ReduxStoreConfig<
	any,
	any,
	infer Selectors
>
	? { [ name in keyof Selectors ]: Function }
	: never;
