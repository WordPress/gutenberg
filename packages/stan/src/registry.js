/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * @typedef {( atomInstance: import('./types').WPAtomInstance<any> ) => void} RegistryListener
 */

/**
 * Creates a new Atom Registry.
 *
 * @param {RegistryListener} onAdd
 * @param {RegistryListener} onDelete
 *
 * @return {import('./types').WPAtomRegistry} Atom Registry.
 */
export const createAtomRegistry = ( onAdd = noop, onDelete = noop ) => {
	const atoms = new WeakMap();

	return {
		getAtom( atomCreator ) {
			if ( ! atoms.get( atomCreator ) ) {
				const atom = atomCreator( this );
				atoms.set( atomCreator, atom );
				onAdd( atom );
			}

			return atoms.get( atomCreator );
		},

		// This shouldn't be necessary since we rely on week map
		// But the legacy selectors/actions API requires us to know when
		// some atoms are removed entirely to unsubscribe.
		deleteAtom( atomCreator ) {
			const atom = atoms.get( atomCreator );
			atoms.delete( atomCreator );
			onDelete( atom );
		},
	};
};
