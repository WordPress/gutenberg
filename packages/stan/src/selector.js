/**
 * Internal dependencies
 */
import { createDerivedAtom } from './derived';

export const createAtomSelector = ( resolver ) => {
	const create = ( ...args ) => createDerivedAtom( resolver( ...args ) );

	return ( ...args ) => ( {
		type: 'selector',
		create,
		args,
	} );
};
