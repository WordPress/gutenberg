/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Create a Moment object from a date string. With no date supplied, default to a Moment
 * object representing now. If a null value is passed, return a null value.
 *
 * @param {?string} date Date representing the currently selected date or null to signify no selection.
 * @return {?moment.Moment} Moment object for selected date or null.
 */
export const getMomentDate = ( date ) => {
	if ( null === date ) {
		return null;
	}
	return date ? moment( date ) : moment();
};
