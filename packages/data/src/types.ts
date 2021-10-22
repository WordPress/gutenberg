export type WPDataFunctionOrGeneratorArray = Array< Function | Generator >;
export type WPDataFunctionArray = Array< Function >;

export interface ActionBase< Type extends string = string > {
	type: Type;
}

export type ActionCreator< Action extends ActionBase = ActionBase > = {
	[ name: string ]: ( ...args: unknown[] ) => Action;
};

export type FunctionThingy = Record< string, Function | Generator > | undefined;
export type BaseActions = FunctionThingy;
export type BaseSelectors = FunctionThingy;

export type EmptyState = Record< string, unknown >;

export interface WPDataAttachedStore<
	Actions extends BaseActions,
	Selectors extends BaseSelectors
> {
	getSelectors: () => Selectors;
	getActions: () => Actions;
	subscribe: ( listener: () => void ) => () => void;
}

export interface WPDataStore<
	Name extends string,
	Actions extends BaseActions,
	Selectors extends BaseSelectors
> {
	/**
	 * Store Name
	 */
	name: Name;

	/**
	 * Store configuration object.
	 */
	instantiate: (
		registry: WPDataRegistry< Name, Actions, Selectors >
	) => WPDataAttachedStore< Actions, Selectors >;
}

export interface WPDataReduxStoreConfig<
	State extends EmptyState,
	Actions extends Record< string, Function | Generator > | undefined,
	Selectors extends Record< string, Function | Generator > | undefined
> {
	reducer: ( state: State, action: any ) => any;
	actions?: Actions;
	resolvers?: WPDataFunctionOrGeneratorArray;
	selectors?: Selectors;
	controls?: WPDataFunctionArray;
}

export interface WPDataRegistry<
	Name extends string = string,
	Actions extends BaseActions = BaseActions,
	Selectors extends BaseSelectors = BaseSelectors
> {
	register: ( store: WPDataStore< Name, Actions, Selectors > ) => void;
	select: (store: Name | WPDataStore<Name, Actions, Selectors>) => Selectors
}

export interface WPDataEmitter {
	emit: () => void;
	subscribe: ( listener: () => void ) => () => void;
	pause: () => void;
	resume: () => void;
	isPaused: boolean;
}
