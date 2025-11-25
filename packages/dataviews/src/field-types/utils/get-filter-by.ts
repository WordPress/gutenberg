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
		let operators = field.filterBy.operators;

		// Assign default values if no operator was provided.
		if ( ! operators || ! Array.isArray( operators ) ) {
			operators = defaultOperators;
		}

		// Make sure only valid operators are included.
		operators = operators.filter( ( operator ) =>
			validOperators.includes( operator )
		);

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

	if ( defaultOperators.length === 0 ) {
		return false;
	}

	return {
		isPrimary: false,
		operators: defaultOperators,
	};
}

export default getFilterBy;
