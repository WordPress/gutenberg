/**
 * External dependencies
 */
import { noop, isObject } from 'lodash';

/**
 * @typedef {( atomInstance: import('./types').WPAtomInstance<any> ) => void} RegistryListener
 */

/**
 * @param {import('./types').WPAtom<any>|import('./types').WPAtomFamilyItem} maybeAtomFamilyItem
 * @return {boolean} maybeAtomFamilyItem is WPAtomFamilyItem.
 */
export function isAtomFamilyItem( maybeAtomFamilyItem ) {
	if (
		isObject( maybeAtomFamilyItem ) &&
		/** @type {import('./types').WPAtomFamilyItem} */ ( maybeAtomFamilyItem )
			.type === 'family'
	) {
		return true;
	}
	return false;
}

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
	const families = new WeakMap();

	const familyRegistry = {
		/**
		 * @param {import('./types').WPAtomFamilyConfig} atomFamilyConfig
		 * @param {any} key
		 * @return {import('./types').WPAtom<any>} Atom instance
		 */
		getAtomFromFamily( atomFamilyConfig, key ) {
			if ( ! families.get( atomFamilyConfig ) ) {
				families.set( atomFamilyConfig, new Map() );
			}

			if ( ! families.get( atomFamilyConfig ).has( key ) ) {
				const atomCreator = atomFamilyConfig.createAtom( key );
				families
					.get( atomFamilyConfig )
					.set( key, atomCreator( registry ) );
			}

			return families.get( atomFamilyConfig ).get( key );
		},

		/**
		 * @param {import('./types').WPAtomFamilyConfig} atomFamilyConfig
		 * @param {any} key
		 */
		deleteAtomFromFamily( atomFamilyConfig, key ) {
			if (
				families.has( atomFamilyConfig ) &&
				families.get( atomFamilyConfig ).has( key )
			) {
				families.get( atomFamilyConfig ).delete( key );
			}
		},
	};

	/** @type {import('./types').WPAtomRegistry} */
	const registry = {
		getAtom( atomCreator ) {
			if ( isAtomFamilyItem( atomCreator ) ) {
				const {
					config,
					key,
				} = /** @type {import('./types').WPAtomFamilyItem} */ ( atomCreator );
				return familyRegistry.getAtomFromFamily( config, key );
			}

			if ( ! atoms.get( atomCreator ) ) {
				const atom = /** @type {import('./types').WPAtom<any>} */ ( atomCreator )(
					registry
				);
				atoms.set( atomCreator, atom );
				onAdd( atom );
			}

			return atoms.get( atomCreator );
		},

		// This shouldn't be necessary since we rely on week map
		// But the legacy selectors/actions API requires us to know when
		// some atoms are removed entirely to unsubscribe.
		deleteAtom( atomCreator ) {
			if ( isAtomFamilyItem( atomCreator ) ) {
				const {
					config,
					key,
				} = /** @type {import('./types').WPAtomFamilyItem} */ ( atomCreator );
				return familyRegistry.deleteAtomFromFamily( config, key );
			}
			const atom = atoms.get( atomCreator );
			atoms.delete( atomCreator );
			onDelete( atom );
		},
	};

	return registry;
};
