/**
 * WordPress dependencies
 */
import type {
	WPAtom,
	WPAtomFamilyItem,
	WPAtomResolver,
	WPAtomRegistry,
	WPAtomUpdater,
} from '@wordpress/stan';

export type WPDataFunctionOrGeneratorArray = {
	[ key: string ]: Function | Generator;
};
export type WPDataFunctionArray = { [ key: string ]: Function };

export interface WPDataAttachedStore {
	getSelectors: () => WPDataFunctionArray;
	getActions: () => WPDataFunctionArray;
	subscribe: ( listener: () => void ) => () => void;
	__internalIsAtomic?: boolean;
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

export type WPDataAtomicStoreSelector< T > = (
	...args: any[]
) => ( props: { get: WPAtomResolver< T > } ) => T;
export type WPDataAtomicStoreAction< T > = (
	...args: any[]
) => ( props: { get: WPAtomResolver< T >; set: WPAtomUpdater< T > } ) => void;

export interface WPDataAtomicStoreConfig {
	rootAtoms: Array< WPAtom< any > | WPAtomFamilyItem< any > >;
	actions?: { [ key: string ]: WPDataAtomicStoreAction< any > };
	selectors?: { [ key: string ]: WPDataAtomicStoreSelector< any > };
}

export interface WPDataRegistry {
	/**
	 * Registers a store.
	 */
	register: ( store: WPDataStore ) => void;

	/**
	 * Retrieves the atom registry.
	 */
	__internalGetAtomRegistry: () => WPAtomRegistry;

	/**
	 * For registry selectors we need to be able to inject the atom resolver.
	 * This setter/getter allows us to so.
	 */
	__internalGetAtomResolver: () => WPAtomResolver< any >;

	/**
	 * Sets the current  atom resolver in the registry.
	 */
	__internalSetAtomResolver: ( resolver: WPAtomResolver< any > ) => void;

	/**
	 * Retrieve or creates an atom per store.
	 * This atom allows selectors to refresh when any change happen on that store.
	 */
	__internalGetAtomForStore: ( storeName: string ) => WPAtom< any >;
}
