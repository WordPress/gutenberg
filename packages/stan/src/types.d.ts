export type WPAtomInstance<T> = {
    /**
     * Optional atom id used for debug.
     */
    id?: string,
    
    /**
     * Atom type.
     */
    type:  string,

    /**
     * Whether the atom instance value is resolved or not. 
     */
    readonly isResolved: boolean,
    
    /**
     * Atom instance setter, used to modify one or multiple atom values.
     */
    set: (t: any)  => void,
    
    /**
     * Retrieves the current value of the atom instance.
     */
    get: () => T,

    /**
     * Subscribes to the value changes of the atom instance.
     */
    subscribe: (listener: () => void) => (() => void)
}

export type WPAtom<T> = ( registry: WPAtomRegistry) => WPAtomInstance<T>;

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
     * Retrieves or creates an atom from the registry.
     */
    getAtom: (atom: WPAtom<any> | WPAtomFamilyItem) => WPAtomInstance<any>

    /**
     * Removes an atom from the registry.
     */
    deleteAtom: (atom: WPAtom<any> | WPAtomFamilyItem) => void
}

export type WPAtomResolver = (atom: WPAtom<any> | WPAtomFamilyItem) => any;

export type WPAtomUpdater = (atom: WPAtom<any> | WPAtomFamilyItem, value: any) => void;

export type WPDerivedAtomResolver<T> = (resolver: WPAtomResolver) => T;

export type WPDerivedAtomUpdater = (resolver: WPAtomResolver, update: WPAtomUpdater, value: any) => void;

export type WPAtomFamilyResolver<T> = (key: any) => WPDerivedAtomResolver<any>;

export type WPAtomFamilyUpdater =  (key: any) => WPDerivedAtomUpdater;

