/**
 * Internal dependencies
 */
import type { NormalizedFilter, Filter } from '../../types';

const EMPTY_ARRAY: [] = [];

export const getCurrentValue = (
	filterDefinition: NormalizedFilter,
	currentFilter?: Filter
) => {
	if ( filterDefinition.singleSelection ) {
		return currentFilter?.value;
	}

	if ( Array.isArray( currentFilter?.value ) ) {
		return currentFilter.value;
	}

	if ( ! Array.isArray( currentFilter?.value ) && !! currentFilter?.value ) {
		return [ currentFilter.value ];
	}

	return EMPTY_ARRAY;
};

/**
 * Formats an ISO date string (YYYY-MM-DD) to a localized date string
 * using the browser's locale.
 *
 * @param value - The ISO date string to format.
 * @return The localized date string, or the original value if parsing fails.
 */
export function formatDateValue( value: string ) {
	const [ year, month, day ] = value
		.split( '-' )
		.map( ( n ) => parseInt( n, 10 ) );
	if ( year && month && day ) {
		return new Date( year, month - 1, day ).toLocaleDateString();
	}
	return value;
}

/**
 * Generates a localized date placeholder string (e.g., "dd/mm/yyyy" or "mm/dd/yyyy")
 * based on the browser's locale.
 *
 * @return The localized date placeholder string.
 */
export function getDatePlaceholder(): string {
	const formatter = new Intl.DateTimeFormat( undefined, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	} );

	const parts = formatter.formatToParts( new Date( 2024, 0, 15 ) );
	return parts
		.map( ( part ) => {
			switch ( part.type ) {
				case 'day':
					return 'dd';
				case 'month':
					return 'mm';
				case 'year':
					return 'yyyy';
				default:
					return part.value;
			}
		} )
		.join( '' );
}
