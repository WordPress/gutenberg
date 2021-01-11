export type State = Record<string | number | symbol, unknown>;
export type PartialState<T extends State> =
	| Partial<T>
	| ((state: T) => Partial<T>);
export type StateSelector<T extends State, U> = (state: T) => U;
export type EqualityChecker<T> = (state: T, newState: T) => boolean;
export type StateListener<T> = (state: T, previousState: T) => void;
export type StateSliceListener<T> = (slice: T, previousSlice: T) => void;
export interface Subscribe<T extends State> {
	(listener: StateListener<T>): () => void;
	<StateSlice>(
		listener: StateSliceListener<StateSlice>,
		selector: StateSelector<T, StateSlice>,
		equalityFn?: EqualityChecker<StateSlice>,
	): () => void;
}
export type SetState<T extends State> = (
	partial: PartialState<T>,
	replace?: boolean,
) => void;
export type GetState<T extends State> = () => T;
export type Destroy = () => void;
export interface StoreApi<T extends State> {
	setState: SetState<T>;
	getState: GetState<T>;
	subscribe: Subscribe<T>;
	destroy: Destroy;
}
export type StateCreator<T extends State, CustomSetState = SetState<T>> = (
	set: CustomSetState,
	get: GetState<T>,
	api: StoreApi<T>,
) => T;

export type Redux<S extends State, A extends { type: unknown }> = (
	set: SetState<S>,
	get: GetState<S>,
	api: StoreApi<S> & {
		dispatch?: (a: A) => A;
		devtools?: any;
	},
) => S & { dispatch: (a: A) => A };

export type NamedSet<S extends State> = (
	partial: PartialState<S>,
	replace?: boolean,
	name?: string,
) => void;

export type DevTools<S extends State> = (
	set: SetState<S>,
	get: GetState<S>,
	api: StoreApi<S> & { dispatch?: unknown; devtools?: any },
) => S;

export type CombineCreate<
	PrimaryState extends State,
	SecondaryState extends State
> = (
	set: SetState<PrimaryState>,
	get: GetState<PrimaryState>,
	api: StoreApi<PrimaryState>,
) => SecondaryState;

export type StateStorage = {
	getItem: (name: string) => string | null | Promise<string | null>;
	setItem: (name: string, value: string) => void | Promise<void>;
};
type StorageValue<S> = { state: S; version: number };

export type PersistOptions<S> = {
	/** Name of the storage (must be unique) */
	name: string;
	/**
	 * A function returning a storage.
	 * The storage must fit `window.localStorage`'s api (or an async version of it).
	 * For example the storage could be `AsyncStorage` from React Native.
	 *
	 * @default () => localStorage
	 */
	getStorage?: () => StateStorage;
	/**
	 * Use a custom serializer.
	 * The returned string will be stored in the storage.
	 *
	 * @default JSON.stringify
	 */
	serialize?: (state: StorageValue<S>) => string | Promise<string>;
	/**
	 * Use a custom deserializer.
	 *
	 * @param str The storage's current value.
	 * @default JSON.parse
	 */
	deserialize?: (str: string) => StorageValue<S> | Promise<S>;
	/**
	 * Prevent some items from being stored.
	 */
	blacklist?: (keyof S)[];
	/**
	 * Only store the listed properties.
	 */
	whitelist?: (keyof S)[];
	/**
	 * A function returning another (optional) function.
	 * The main function will be called before the storage rehydration.
	 * The returned function will be called after the storage rehydration.
	 */
	onRehydrateStorage?: (state: S) => ((state: S) => void) | void;
	/**
	 * If the stored state's version mismatch the one specified here, the storage will not be used.
	 * This is useful when adding a breaking change to your store.
	 */
	version?: number;
};

export interface UseStore<T extends State> {
	(): T;
	<U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U;
	setState: SetState<T>;
	getState: GetState<T>;
	subscribe: Subscribe<T>;
	destroy: Destroy;
}
