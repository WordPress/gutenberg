/**
 * Creates a store atom.
 *
 * @template T
 * @param {(listener: () => void) => (() => void)} subscribe Subscribe to state changes.
 * @param {() => T}                                get       Get the state value.
 * @param {(action: any) => void}                  dispatch  Dispatch store changes,
 * @param {import('./types').WPCommonAtomConfig=}  config    Common Atom config.
 * @return {import("./types").WPAtom<T>} Store Atom.
 */
export const createStoreAtom = (
	subscribe,
	get,
	dispatch,
	config = {}
) => () => {
	let isResolved = false;
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
			isResolved = true;
			return subscribe( l );
		},
		get isResolved() {
			return isResolved;
		},
	};
};
