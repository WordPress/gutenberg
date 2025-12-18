/**
 * External dependencies
 */
import { UTCDateMini } from '@date-fns/utc';

/**
 * WordPress dependencies
 */
import { date as formatDate, getDate } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type { InputState } from '../input-control/reducer/state';
import type { InputAction } from '../input-control/reducer/actions';
import { COMMIT, PRESS_DOWN, PRESS_UP } from '../input-control/reducer/actions';

/**
 * Converts a date input to a UTC-normalized date for consistent date
 * manipulation. Timezoneless strings are interpreted using the timezone
 * offset from @wordpress/date settings. Date objects and timestamps
 * represent specific UTC instants.
 *
 * @param input Value to turn into a date.
 */
export function inputToDate( input: Date | string | number ): Date {
	if ( typeof input === 'string' ) {
		// Note that JavaScript doesn't fully support ISO-8601 time strings, so
		// the behavior of passing these through to the Date constructor is
		// non-deterministic.
		//
		// See: https://tc39.es/ecma262/#sec-date-time-string-format
		const hasTimezone = /Z|[+-]\d{2}(:?\d{2})?$/.test( input );
		if ( hasTimezone ) {
			return new UTCDateMini( new Date( input ) );
		}

		// Strings without timezone indicators are interpreted using configured
		// timezone offset, then converted to UTC for internal storage.
		return new UTCDateMini( getDate( input ).getTime() );
	}

	// Date objects and number timestamps represent specific UTC moments.
	// Convert to milliseconds since epoch for consistent UTC handling.
	const time = input instanceof Date ? input.getTime() : input;
	return new UTCDateMini( time );
}

/**
 * Returns the start of day (midnight) as a browser-local Date for the calendar
 * day in the configured timezone in @wordpress/date settings. This is necessary
 * because date-fns's startOfDay operates in browser local time, which can cause
 * off-by-one-day bugs when browser and configured timezones differ.
 *
 * For example, if the UTC time is Nov 16, 01:00 UTC and configured timezone
 * is UTC-5, the date is Nov 15. This function returns a browser-local Date
 * at Nov 15, 00:00 (browser local midnight) so it matches calendar days.
 *
 * @param date A Date object normalized to UTC
 * @return A browser-local Date at midnight for the configured timezone date
 */
export function startOfDayInConfiguredTimezone( date: Date ): Date {
	// Determine the calendar day in the configured WordPress timezone and
	// return a browser-local Date at midnight for that calendar day.
	const year = Number( formatDate( 'Y', date ) );
	const month = Number( formatDate( 'n', date ) ) - 1;
	const day = Number( formatDate( 'j', date ) );
	return new Date( year, month, day, 0, 0, 0, 0 );
}

/**
 * Converts a 12-hour time to a 24-hour time.
 * @param hours
 * @param isPm
 */
export function from12hTo24h( hours: number, isPm: boolean ) {
	return isPm ? ( ( hours % 12 ) + 12 ) % 24 : hours % 12;
}

/**
 * Converts a 24-hour time to a 12-hour time.
 * @param hours
 */
export function from24hTo12h( hours: number ) {
	return hours % 12 || 12;
}

/**
 * Creates an InputControl reducer used to pad an input so that it is always a
 * given width. For example, the hours and minutes inputs are padded to 2 so
 * that '4' appears as '04'.
 *
 * @param pad How many digits the value should be.
 */
export function buildPadInputStateReducer( pad: number ) {
	return ( state: InputState, action: InputAction ) => {
		const nextState = { ...state };
		if (
			action.type === COMMIT ||
			action.type === PRESS_UP ||
			action.type === PRESS_DOWN
		) {
			if ( nextState.value !== undefined ) {
				nextState.value = nextState.value
					.toString()
					.padStart( pad, '0' );
			}
		}
		return nextState;
	};
}

/**
 * Updates specific date fields in the configured timezone and returns a new
 * UTC date.
 *
 * @param date    A Date object
 * @param updates Object with fields to update
 * @return A Date object normalized to UTC with the updated values
 */
export function setInConfiguredTimezone(
	date: Date,
	updates: Partial< {
		year: number;
		month: number;
		date: number;
		hours: number;
		minutes: number;
		seconds: number;
	} >
): Date {
	const values = {
		year: Number( formatDate( 'Y', date ) ),
		month: Number( formatDate( 'n', date ) ) - 1,
		date: Number( formatDate( 'j', date ) ),
		hours: Number( formatDate( 'H', date ) ),
		minutes: Number( formatDate( 'i', date ) ),
		seconds: Number( formatDate( 's', date ) ),
		...updates,
	};

	const year = String( values.year );
	const month = String( values.month + 1 ).padStart( 2, '0' );
	const day = String( values.date ).padStart( 2, '0' );
	const hours = String( values.hours ).padStart( 2, '0' );
	const minutes = String( values.minutes ).padStart( 2, '0' );
	const seconds = String( values.seconds ).padStart( 2, '0' );
	const timezoneless = `${ year }-${ month }-${ day }T${ hours }:${ minutes }:${ seconds }`;

	// Parse as WordPress-configured timezone time and convert to a UTC instant.
	return new UTCDateMini( getDate( timezoneless ).getTime() );
}

/**
 * Validates the target of a React event to ensure it is an input element and
 * that the input is valid.
 * @param event
 */
export function validateInputElementTarget( event: React.SyntheticEvent ) {
	// `instanceof` checks need to get the instance definition from the
	// corresponding window object — therefore, the following logic makes
	// the component work correctly even when rendered inside an iframe.
	const HTMLInputElementInstance =
		( event.target as HTMLInputElement )?.ownerDocument.defaultView
			?.HTMLInputElement ?? HTMLInputElement;

	if ( ! ( event.target instanceof HTMLInputElementInstance ) ) {
		return false;
	}

	return event.target.validity.valid;
}
