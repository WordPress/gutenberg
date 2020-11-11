/**
 * External dependencies
 */
import { mapValues } from 'lodash';

export function createAtomicStore( config, registry ) {
	// I'm probably missing the atom resolver here
	const selectors = mapValues( config.selectors, ( atomSelector ) => {
		return ( ...args ) => {
			return atomSelector( ( atomCreator ) =>
				registry.atomRegistry.getAtom( atomCreator ).get()
			)( ...args );
		};
	} );

	const actions = mapValues( config.actions, ( atomAction ) => {
		return ( ...args ) => {
			return atomAction(
				( atomCreator ) =>
					registry.atomRegistry.getAtom( atomCreator ).get(),
				( atomCreator, value ) =>
					registry.atomRegistry.getAtom( atomCreator ).set( value ),
				registry.atomRegistry
			)( ...args );
		};
	} );

	return {
		getSelectors: () => selectors,
		getActions: () => actions,
		// The registry subscribes to all atomRegistry by default.
		subscribe: () => () => {},
	};
}
