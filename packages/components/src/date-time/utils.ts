/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Create a Moment object from a date string. With no date supplied, default to
 * a Moment object representing now. If a null value is passed, return a null
 * value.
 *
 * @param  [date] Date representing the currently selected
 *                date or null to signify no selection.
 * @return Moment object for selected date or null.
 */
export const getMomentDate = ( date?: Date | string | number | null ) => {
	if ( null === date ) {
		return null;
	}
	return date ? moment( date ) : moment();
};
