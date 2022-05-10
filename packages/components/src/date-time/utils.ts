/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Internal dependencies
 */
import type { ValidDateTimeInput } from './types';

/**
 * Create a Moment object from a date string. With no date supplied, default to
 * a Moment object representing now. If a null value is passed, return a null
 * value.
 *
 * @param {ValidDateTimeInput} [date] Date representing the currently selected
 *                                    date or null to signify no selection.
 * @return {?moment.Moment} Moment object for selected date or null.
 */
export const getMomentDate = ( date: ValidDateTimeInput | undefined ) => {
	if ( null === date ) {
		return null;
	}
	return date ? moment( date ) : moment();
};
