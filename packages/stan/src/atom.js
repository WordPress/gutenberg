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
export const createAtom = ( initialValue, config = {} ) => () => {
	let value = initialValue;

	/**
	 * @type {Set<() => void>}
	 */
	const listeners = new Set();

	return {
		id: config.id,
		type: 'root',
		set( newValue ) {
			value = newValue;
			return Promise.all( Array.from( listeners ).map( ( l ) => l() ) );
		},
		get() {
			return Promise.resolve( value );
		},
		async resolve() {
			return Promise.resolve( value );
		},
		subscribe( listener ) {
			listeners.add( listener );
			return Promise.resolve( () => {
				listeners.delete( listener );
			} );
		},
		isResolved: true,
	};
};
