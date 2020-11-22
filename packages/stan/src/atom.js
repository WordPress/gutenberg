/** @typedef {import('./types').WPCommonAtomConfig} WPCommonAtomConfig */
/**
 * @template T
 * @typedef {import("./types").WPAtom<T>} WPAtom
 */

/**
 * Creates a basic atom.
 *
 * @template T
 * @param {T}                   initialValue Initial value in the atom. *
 * @param {WPCommonAtomConfig=} config       Common Atom config.
 * @return {WPAtom<T>} Created atom.
 */
export const createAtom = ( initialValue, config = {} ) => ( registry ) => {
	let value = initialValue;
	const identifier = {};

	/**
	 * @type {Set<() => void>}
	 */
	const listeners = new Set();
	const notifyListeners = () => {
		listeners.forEach( ( l ) => l() );
	};

	return {
		id: config.id,
		type: 'root',
		set( newValue ) {
			value = newValue;
			registry.updateListeners( identifier, notifyListeners );
		},
		get() {
			return value;
		},
		async resolve() {
			return value;
		},
		subscribe( listener ) {
			listeners.add( listener );
			return () => {
				listeners.delete( listener );
			};
		},
		isResolved: true,
	};
};
