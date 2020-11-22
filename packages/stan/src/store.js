/**
 * @template T
 * @typedef {import("./types").WPAtom<T>} WPAtom
 */
/**
 * @typedef {import("./types").WPCommonAtomConfig} WPCommonAtomConfig
 */
/**
 * @template T
 * @typedef {import("./types").WPAtomSelector<T>} WPAtomSelector
 */

/**
 * Creates a store atom.
 *
 * @template T
 * @param {(listener: () => void) => (() => void)} subscribe Subscribe to state changes.
 * @param {() => T}                                get       Get the state value.
 * @param {(action: any) => void}                  dispatch  Dispatch store changes,
 * @param {WPCommonAtomConfig=}                    config    Common Atom config.
 * @return {WPAtom<T>} Store Atom.
 */
export const createStoreAtom = (
	subscribe,
	get,
	dispatch,
	config = {}
) => () => {
	return {
		id: config.id,
		type: 'store',
		get() {
			return get();
		},
		set( action ) {
			dispatch( action );
		},
		subscribe: ( l ) => {
			return subscribe( l );
		},
		isResolved: true,
	};
};

/**
 * @template T
 * @param {(...args:any[]) => (listener: () => void) => (() => void)} subscribe Subscribe to state changes.
 * @param {(...args:any[]) => () => T}                                get       Get the state value.
 * @param {(...args:any[]) => (action: any) => void}                  dispatch  Dispatch store changes,
 * @param {WPCommonAtomConfig=}                                       atomConfig   Common Atom config.
 * @return {(...args:any[]) => WPAtomSelector<T>} Atom selector creator.
 */
export const createStoreAtomSelector = (
	subscribe,
	get,
	dispatch,
	atomConfig
) => {
	const config = {
		/**
		 * @param {...any[]} args Selector arguments
		 * @return {WPAtom<any>} Atom.
		 */
		createAtom( ...args ) {
			return createStoreAtom(
				subscribe( ...args ),
				get( ...args ),
				dispatch( ...args ),
				{
					...atomConfig,
				}
			);
		},
	};

	return ( ...args ) => {
		return {
			type: 'selector',
			config,
			args,
		};
	};
};
