export type WPAtomListener =  () => void;

export type WPAtomState<T> = {
	/**
	 * Optional atom id used for debug.
	 */
	id?: string,

	/**
	 * Atom type.
	 */
	type:  string,

	/**
	 * Whether the atom state value is resolved or not. 
	 */
	readonly isResolved: boolean,

	/**
	 * Atom state setter, used to modify one or multiple atom values.
	 */
	set: (t: any)  => void,

	/**
	 * Retrieves the current value of the atom state.
	 */
	get: () => T,

	/**
	 * Subscribes to the value changes of the atom state.
	 */
	subscribe: ( listener: WPAtomListener ) => (() => void)
}

export type WPAtom<T> = (registry: WPAtomRegistry) => WPAtomState<T>;

export type WPAtomFamilyConfig<T> = {
	/**
	 * Creates an atom for the given key
	 */
	createAtom: (key: any) => WPAtom<T>
}

export type WPAtomFamilyItem<T> = {
	/**
	 * Type which value is "family" to indicate that this is a family.
	 */
	type: string,

	/**
	 * Family config used for this item.
	 */
	config: WPAtomFamilyConfig<T>,

	/**
	 * Item key
	 */
	key: any,
}

export type WPAtomRegistry = {
	/**
	 * Reads an atom vale.
	 */
	get: <T>(atom: WPAtom<T> | WPAtomFamilyItem<T>) => T

	/**
	 * Update an atom value.
	 */
	set: <T>(atom: WPAtom<T> | WPAtomFamilyItem<T>, value: any) => void

	/**
	 * Retrieves or creates an atom from the registry.
	 */
	subscribe: <T>(atom: WPAtom<T> | WPAtomFamilyItem<T>, listener: WPAtomListener ) => (() => void)

	/**
	 * Removes an atom from the registry.
	 */
	delete: <T>(atom: WPAtom<T> | WPAtomFamilyItem<T>) => void

	/**
	 * Retrieves the atom state for a given atom.
	 * This shouldn't be used directly, prefer the other methods.
	 */
	__unstableGetAtomState: <T>(atom: WPAtom<T> | WPAtomFamilyItem<T>) => WPAtomState<any>
}

export type WPAtomResolver<T> = (atom: WPAtom<T> | WPAtomFamilyItem<T>) => T;

export type WPAtomUpdater<T> = (atom: WPAtom<T> | WPAtomFamilyItem<T>, value: any) => void;

export type WPDerivedAtomResolver<T> = (props: { get: WPAtomResolver<T> } ) => T;

export type WPDerivedAtomUpdater<T> = ( props: { get: WPAtomResolver<T>, set: WPAtomUpdater<T> }, value: any) => void;

export type WPAtomFamilyResolver<T> = (key: any) => WPDerivedAtomResolver<T>;

export type WPAtomFamilyUpdater<T> =  (key: any) => WPDerivedAtomUpdater<T>;

