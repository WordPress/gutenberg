/**
 * Internal dependencies
 */
import type { Field, FilterByConfig, Operator } from '../../types';

function getFilterBy< Item >(
	field: Field< Item >,
	defaultOperators: Operator[],
	validOperators: Operator[]
): Required< FilterByConfig > | false {
	if ( field.filterBy === false ) {
		return false;
	}

	if ( typeof field.filterBy === 'object' ) {
		const operators =
			field.filterBy?.operators?.filter( ( op ) =>
				validOperators.includes( op )
			) ?? defaultOperators;

		// If no operators are left at this point,
		// the filters should be disabled.
		if ( operators.length === 0 ) {
			return false;
		}

		return {
			isPrimary: !! field.filterBy.isPrimary,
			operators,
		};
	}

	// The field hasn't defined any filterBy config.
	if ( defaultOperators.length === 0 ) {
		return false;
	}

	return {
		isPrimary: false,
		operators: defaultOperators,
	};
}

export default getFilterBy;
