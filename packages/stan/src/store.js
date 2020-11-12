/**
 * Creates a store atom.
 *
 * @template T
 * @param {() => T}                                get       Get the state value.
 * @param {(listener: () => void) => (() => void)} subscribe Subscribe to state changes.
 * @param {(action: any) => void}                  dispatch  Dispatch store changes,
 * @param {string=}                                id        Atom id.
 * @return {import("./types").WPAtom<T>} Store Atom.
 */
export const createStoreAtom = ( subscribe, get, dispatch, id ) => () => {
	let isResolved = false;
	return {
		id,
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
