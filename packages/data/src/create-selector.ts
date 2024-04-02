/**
 * External dependencies
 */
import createSel from 'rememo';

const NULL_OBJ = {};
const TRUE_OBJ = {};
const FALSE_OBJ = {};

export function createSelector< S extends ( ...args: any[] ) => any >(
	sel: S,
	dep: any
): S {
	return createSel( sel, ( ...args ) => {
		if ( ! dep ) {
			return [];
		}

		const deps = dep( ...args );

		return deps.map( ( d: any ) => {
			if ( d === null || d === undefined ) {
				return NULL_OBJ;
			}
			if ( d === true ) {
				return TRUE_OBJ;
			}

			if ( d === false ) {
				return FALSE_OBJ;
			}

			return d;
		} );
	} );
}
