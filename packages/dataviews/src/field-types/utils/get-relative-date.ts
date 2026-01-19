/**
 * External dependencies
 */
import { subDays, subWeeks, subMonths, subYears } from 'date-fns';

/**
 * Calculates a date offset from now.
 *
 * @param value Number of units to offset.
 * @param unit  Unit of time to offset (days, weeks, months, years).
 * @return      Date offset from now.
 */
export default function getRelativeDate( value: number, unit: string ): Date {
	switch ( unit ) {
		case 'days':
			return subDays( new Date(), value );
		case 'weeks':
			return subWeeks( new Date(), value );
		case 'months':
			return subMonths( new Date(), value );
		case 'years':
			return subYears( new Date(), value );
		default:
			return new Date();
	}
}
