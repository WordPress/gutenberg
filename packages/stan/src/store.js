/**
 * @template T
 * @typedef {import("./types").WPAtom<T>} WPAtom
 */
/**
 * @typedef {import("./types").WPCommonAtomConfig} WPCommonAtomConfig
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
