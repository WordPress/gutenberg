/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { createDerivedAtom } from '@wordpress/stan';

/**
 *
 * @param {string}                                     name   Store name.
 * @param {import('../types').WPDataAtomicStoreConfig} config Atomic store config.
 * @return {import('../types').WPDataStore} Store.
 */
export default function createAtomicStore( name, config ) {
	return {
		name,
		instantiate: ( registry ) => {
			// I'm probably missing the atom resolver here
			const selectors = mapValues( config.selectors, ( atomSelector ) => {
				return ( /** @type {any[]} **/ ...args ) => {
					const get = registry.__internalGetAtomResolver()
						? registry.__internalGetAtomResolver()
						: (
								/** @type {import('@wordpress/stan/src/types').WPAtom<any>|import('@wordpress/stan/src/types').WPAtomFamilyItem<any>} **/ atom
						  ) => registry.__internalGetAtomRegistry().get( atom );
					return atomSelector( ...args )( { get } );
				};
			} );

			const actions = mapValues( config.actions, ( atomAction ) => {
				return ( /** @type {any[]} **/ ...args ) => {
					return atomAction( ...args )( {
						get: ( atomCreator ) =>
							registry
								.__internalGetAtomRegistry()
								.get( atomCreator ),
						set: ( atomCreator, value ) =>
							registry
								.__internalGetAtomRegistry()
								.set( atomCreator, value ),
					} );
				};
			} );

			return {
				__internalIsAtomic: true,
				getSelectors: () => selectors,
				getActions: () => actions,

				// Subscribing to the root atoms allows us
				// To refresh the data when all root selector change.
				subscribe: ( listener ) => {
					const atom = createDerivedAtom( ( { get } ) => {
						config.rootAtoms.forEach( ( subatom ) =>
							get( subatom )
						);
					} );

					return registry
						.__internalGetAtomRegistry()
						.subscribe( atom, listener );
				},
			};
		},
	};
}
