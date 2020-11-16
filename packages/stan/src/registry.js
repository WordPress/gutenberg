/**
 * External dependencies
 */
import { noop, isObject } from 'lodash';

/**
 * @typedef {( atomState: import('./types').WPAtomState<any> ) => void} RegistryListener
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

	/**
	 * @param {import('./types').WPAtom<any>|import('./types').WPAtomFamilyItem} atom Atom.
	 * @return {import('./types').WPAtomState<any>} Atom state;
	 */
	const getAtomState = ( atom ) => {
		if ( isAtomFamilyItem( atom ) ) {
			const {
				config,
				key,
			} = /** @type {import('./types').WPAtomFamilyItem} */ ( atom );
			return familyRegistry.getAtomFromFamily( config, key );
		}

		if ( ! atoms.get( atom ) ) {
			const atomState = /** @type {import('./types').WPAtom<any>} */ ( atom )(
				registry
			);
			atoms.set( atom, atomState );
			onAdd( atomState );
		}

		return atoms.get( atom );
	};

	const familyRegistry = {
		/**
		 * @param {import('./types').WPAtomFamilyConfig} atomFamilyConfig
		 * @param {any} key
		 * @return {import('./types').WPAtomState<any>} Atom state.
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
		__unstableGetAtomState: getAtomState,

		get( atom ) {
			return getAtomState( atom ).get();
		},

		set( atom, value ) {
			return getAtomState( atom ).set( value );
		},

		subscribe( atom, listener ) {
			return getAtomState( atom ).subscribe( listener );
		},

		// This shouldn't be necessary since we rely on week map
		// But the legacy selectors/actions API requires us to know when
		// some atoms are removed entirely to unsubscribe.
		delete( atom ) {
			if ( isAtomFamilyItem( atom ) ) {
				const {
					config,
					key,
				} = /** @type {import('./types').WPAtomFamilyItem} */ ( atom );
				return familyRegistry.deleteAtomFromFamily( config, key );
			}
			const atomState = atoms.get( atom );
			atoms.delete( atom );
			onDelete( atomState );
		},
	};

	return registry;
};
