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

export type WPAtomRegistry = {
    /**
     * Retrieves an atom from the registry.
     */
    getAtom: (atom: WPAtom<any>) => WPAtomInstance<any>

    /**
     * Removes an atom from the registry.
     */
    deleteAtom: (atom: WPAtom<any>) => void
}

