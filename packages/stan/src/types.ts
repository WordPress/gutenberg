export type WPAtomListener = () => void;

export interface WPCommonAtomConfig {
	/**
	 * Optinal id used for debug.
	 */
	id?: string;

	/**
	 * Whether the atom is sync or async.
	 */
	isAsync?: boolean;
}

export interface WPAtomState< T > {
	/**
	 * Optional atom id used for debug.
	 */
	id?: string;

	/**
	 * Atom type.
	 */
	type: string;

	/**
	 * Whether the atom state value is resolved or not.
	 */
	readonly isResolved: boolean;

	/**
	 * Atom state setter, used to modify one or multiple atom values.
	 */
	set: ( t: any ) => void;

	/**
	 * Retrieves the current value of the atom state.
	 */
	get: () => T;

	/**
	 * Subscribes to the value changes of the atom state.
	 */
	subscribe: ( listener: WPAtomListener ) => () => void;
}

export type WPAtom< T > = ( registry: WPAtomRegistry ) => WPAtomState< T >;

export interface WPAtomSelectorConfig< T > {
	/**
	 * Creates an atom for the given key
	 */
	createAtom: ( ...args: any[] ) => WPAtom< T >;
}

export interface WPAtomSelector< T > {
	/**
	 * Type which value is "selector" to indicate that this is a selector.
	 */
	type: string;

	/**
	 * Selector config used for this item.
	 */
	config: WPAtomSelectorConfig< T >;

	/**
	 * Selector args
	 */
	args: any[];
}

export interface WPAtomRegistry {
	/**
	 * Reads an atom vale.
	 */
	get: < T >( atom: WPAtom< T > | WPAtomSelector< T > ) => T;

	/**
	 * Update an atom value.
	 */
	set: < T >( atom: WPAtom< T > | WPAtomSelector< T >, value: any ) => void;

	/**
	 * Retrieves or creates an atom from the registry.
	 */
	subscribe: < T >(
		atom: WPAtom< T > | WPAtomSelector< T >,
		listener: WPAtomListener
	) => () => void;

	/**
	 * Removes an atom from the registry.
	 */
	delete: < T >( atom: WPAtom< T > | WPAtomSelector< T > ) => void;

	/**
	 * Retrieves the atom state for a given atom.
	 * This shouldn't be used directly, prefer the other methods.
	 */
	__unstableGetAtomState: < T >(
		atom: WPAtom< T > | WPAtomSelector< T >
	) => WPAtomState< any >;
}

export type WPAtomResolver< T > = (
	atom: WPAtom< T > | WPAtomSelector< T >
) => T;

export type WPAtomUpdater< T > = (
	atom: WPAtom< T > | WPAtomSelector< T >,
	value: any
) => void;

export type WPDerivedAtomResolver< T > = ( props: {
	get: WPAtomResolver< T >;
} ) => T;

export type WPDerivedAtomUpdater< T > = (
	props: { get: WPAtomResolver< T >; set: WPAtomUpdater< T > },
	value: any
) => void;

export type WPAtomSelectorResolver< T > = (
	...args: any[]
) => WPDerivedAtomResolver< T >;

export type WPAtomSelectorUpdater< T > = (
	...args: any[]
) => WPDerivedAtomUpdater< T >;
