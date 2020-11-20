/**
 * External dependencies
 */
import { noop, isObject } from 'lodash';
// @ts-ignore
import EquivalentKeyMap from 'equivalent-key-map';

/** @typedef {import('./types').WPAtomRegistry} WPAtomRegistry */
/**
 * @template T
 * @typedef {import("./types").WPAtomSelectorResolver<T>} WPAtomSelectorResolver
 */
/**
 * @template T
 * @typedef {import("./types").WPAtomState<T>} WPAtomState
 */
/**
 * @template T
 * @typedef {import("./types").WPAtom<T>} WPAtom
 */
/**
 * @template T
 * @typedef {import("./types").WPAtomSelector<T>} WPAtomSelector
 */
/**
 * @template T
 * @typedef {import("./types").WPAtomSelectorConfig<T>} WPAtomSelectorConfig
 */
/**
 * @typedef {( atomState: import('./types').WPAtomState<any> ) => void} RegistryListener
 */

/**
 * @template T
 * @param {WPAtom<any>|WPAtomSelector<T>} maybeAtomSelector
 * @return {boolean} maybeAtomSelector Returns `true` when atom selector detected.
 */
export function isAtomSelector( maybeAtomSelector ) {
	return (
		isObject( maybeAtomSelector ) &&
		/** @type {WPAtomSelector<any>} */ ( maybeAtomSelector ).type ===
			'selector'
	);
}

/**
 * Creates a new Atom Registry.
 *
 * @param {RegistryListener} onAdd
 * @param {RegistryListener} onDelete
 *
 * @return {WPAtomRegistry} Atom Registry.
 */
export const createAtomRegistry = ( onAdd = noop, onDelete = noop ) => {
	const atoms = new WeakMap();
	const selectors = new WeakMap();

	/**
	 * @template T
	 * @param {WPAtom<T>|WPAtomSelector<T>} atom Atom.
	 * @return {WPAtomState<T>} Atom state.
	 */
	const getAtomState = ( atom ) => {
		if ( isAtomSelector( atom ) ) {
			const {
				config,
				args,
			} = /** @type {WPAtomSelector<any>} */ ( atom );
			return selectorRegistry.getAtomSelector( config, args );
		}

		if ( ! atoms.get( atom ) ) {
			const atomState = /** @type {WPAtom<any>} */ ( atom )( registry );
			atoms.set( atom, atomState );
			onAdd( atomState );
		}

		return atoms.get( atom );
	};

	const selectorRegistry = {
		/**
		 * @template T
		 * @param {WPAtomSelectorConfig<T>} atomSelectorConfig
		 * @param {any[]} args
		 * @return {WPAtomState<T>} Atom state.
		 */
		getAtomSelector( atomSelectorConfig, args ) {
			if ( ! selectors.get( atomSelectorConfig ) ) {
				selectors.set( atomSelectorConfig, new EquivalentKeyMap() );
			}

			const selectorsMap = selectors.get( atomSelectorConfig );
			if ( ! selectorsMap.has( args ) ) {
				const atomCreator = atomSelectorConfig.createAtom( ...args );
				selectorsMap.set( args, atomCreator( registry ) );
			}

			return selectorsMap.get( args );
		},

		/**
		 * @template T
		 * @param {WPAtomSelectorConfig<T>} atomSelectorConfig
		 * @param {any[]} args
		 */
		deleteAtomSelector( atomSelectorConfig, args ) {
			if (
				selectors.has( atomSelectorConfig ) &&
				selectors.get( atomSelectorConfig ).has( args )
			) {
				selectors.get( atomSelectorConfig ).delete( args );
			}
		},
	};

	/** @type {WPAtomRegistry} */
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
			if ( isAtomSelector( atom ) ) {
				const {
					config,
					args,
				} = /** @type {WPAtomSelector<any>} */ ( atom );
				return selectorRegistry.deleteAtomSelector( config, args );
			}
			const atomState = atoms.get( atom );
			atoms.delete( atom );
			onDelete( atomState );
		},
	};

	return registry;
};
