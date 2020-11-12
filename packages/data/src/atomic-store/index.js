/**
 * External dependencies
 */
import { mapValues } from 'lodash';

export function createAtomicStore( config, registry ) {
	// I'm probably missing the atom resolver here
	const selectors = mapValues( config.selectors, ( atomSelector ) => {
		return ( ...args ) => {
			return atomSelector( ( atomCreator ) =>
				registry.getAtomRegistry().getAtom( atomCreator ).get()
			)( ...args );
		};
	} );

	const actions = mapValues( config.actions, ( atomAction ) => {
		return ( ...args ) => {
			return atomAction(
				( atomCreator ) =>
					registry.getAtomRegistry().getAtom( atomCreator ).get(),
				( atomCreator, value ) =>
					registry
						.getAtomRegistry()
						.getAtom( atomCreator )
						.set( value ),
				registry.getAtomRegistry()
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
