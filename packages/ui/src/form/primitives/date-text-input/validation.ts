import { __, sprintf } from '@wordpress/i18n';
import { parseISODate } from './date-model';
import type { DateConstraints } from './types';

export function serializeDate( value: string | null ): string {
	if ( value === null ) {
		return '';
	}
	if ( ! parseISODate( value ) ) {
		throw new RangeError(
			'DateInput: value must be a valid YYYY-MM-DD date or null.'
		);
	}
	return value;
}

export function assertDateConstraints( { min, max }: DateConstraints ) {
	if ( min !== undefined ) {
		serializeDate( min );
	}
	if ( max !== undefined ) {
		serializeDate( max );
	}
	if ( min && max && min > max ) {
		throw new RangeError( 'DateInput: min must not be after max.' );
	}
}

export function getDateError(
	text: string,
	{ min, max, isDateUnavailable }: DateConstraints,
	format: ( value: string ) => string = ( value ) => value
) {
	if ( text === '' ) {
		return '';
	}
	if ( ! parseISODate( text ) ) {
		return __( 'Enter a valid date in YYYY-MM-DD format.' );
	}
	if ( min && text < min ) {
		/* translators: %s: Earliest permitted localized date. */
		return sprintf( __( 'Enter a date on or after %s.' ), format( min ) );
	}
	if ( max && text > max ) {
		/* translators: %s: Latest permitted localized date. */
		return sprintf( __( 'Enter a date on or before %s.' ), format( max ) );
	}
	return isDateUnavailable?.( text ) ? __( 'This date is unavailable.' ) : '';
}
