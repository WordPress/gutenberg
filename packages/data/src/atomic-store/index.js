/**
 * External dependencies
 */
import { mapValues } from 'lodash';

export function createAtomicStore( config, registry ) {
	// I'm probably missing the atom resolver here
	const selectors = mapValues( config.selectors, ( atomSelector ) => {
		return ( ...args ) => {
			return atomSelector(
				registry.__unstableGetAtomResolver()
					? registry.__unstableGetAtomResolver()
					: ( atomCreator ) =>
							registry.getAtomRegistry().get( atomCreator )
			)( ...args );
		};
	} );

	const actions = mapValues( config.actions, ( atomAction ) => {
		return ( ...args ) => {
			return atomAction(
				( atomCreator ) =>
					registry.getAtomRegistry().get( atomCreator ),
				( atomCreator, value ) =>
					registry.getAtomRegistry().set( atomCreator, value ),
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
