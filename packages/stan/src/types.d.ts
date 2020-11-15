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

export type WPAtomFamilyConfig = {
	/**
	 * Creates an atom for the given key
	 */
	createAtom: (key: any) => WPAtom<any>
}

export type WPAtomFamilyItem = {
	/**
	 * Type which value is "family" to indicate that this is a family.
	 */
	type: string,

	/**
	 * Family config used for this item.
	 */
	config: WPAtomFamilyConfig,

	/**
	 * Item key
	 */
	key: any,
}

export type WPAtomRegistry = {
	/**
	 * Reads an atom vale.
	 */
	read: (atom: WPAtom<any> | WPAtomFamilyItem) => any

	/**
	 * Update an atom value.
	 */
	write: (atom: WPAtom<any> | WPAtomFamilyItem, value: any) => void

	/**
	 * Retrieves or creates an atom from the registry.
	 */
	subscribe: (atom: WPAtom<any> | WPAtomFamilyItem, listener: WPAtomListener ) => (() => void)

	/**
	 * Removes an atom from the registry.
	 */
	delete: (atom: WPAtom<any> | WPAtomFamilyItem) => void

	/**
	 * Retrieves the atom state for a given atom.
	 * This shouldn't be used directly, prefer the other methods.
	 */
	__unstableGetAtomState: (atom: WPAtom<any> | WPAtomFamilyItem) => WPAtomState<any>
}

export type WPAtomResolver = (atom: WPAtom<any> | WPAtomFamilyItem) => any;

export type WPAtomUpdater = (atom: WPAtom<any> | WPAtomFamilyItem, value: any) => void;

export type WPDerivedAtomResolver<T> = (props: { get: WPAtomResolver } ) => T;

export type WPDerivedAtomUpdater = ( props: { get: WPAtomResolver, set: WPAtomUpdater }, value: any) => void;

export type WPAtomFamilyResolver<T> = (key: any) => WPDerivedAtomResolver<any>;

export type WPAtomFamilyUpdater =  (key: any) => WPDerivedAtomUpdater;

