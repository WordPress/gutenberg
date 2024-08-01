/**
 * Internal dependencies
 */
import type { SortDirection, Option } from '../types';

function sort( a: any, b: any, direction: SortDirection ) {
	return direction === 'asc' ? a - b : b - a;
}

function isValid( value: any, elements?: Option[] ) {
	// TODO: this implicitely means the value is required.
	if ( value === '' ) {
		return false;
	}

	if ( ! Number.isInteger( Number( value ) ) ) {
		return false;
	}

	if ( elements ) {
		const validValues = elements.map( ( f ) => f.value );
		if ( ! validValues.includes( Number( value ) ) ) {
			return false;
		}
	}

	return true;
}

export default {
	sort,
	isValid,
};
