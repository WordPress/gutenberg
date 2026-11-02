import { __, sprintf } from '@wordpress/i18n';
import { parseISODate } from './date-model';
import type { DateConstraints, DateRangeValue, TimeInputProps } from './types';

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

export function parseDate( text: string ): string | null | undefined {
	return text === '' ? null : ( parseISODate( text ) ?? undefined );
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
	{ min, max, isDateUnavailable }: DateConstraints
) {
	if ( text === '' ) {
		return '';
	}
	if ( ! parseISODate( text ) ) {
		return __( 'Enter a valid date in YYYY-MM-DD format.' );
	}
	if ( min && text < min ) {
		/* translators: %s: Earliest permitted ISO date. */
		return sprintf( __( 'Enter a date on or after %s.' ), min );
	}
	if ( max && text > max ) {
		/* translators: %s: Latest permitted ISO date. */
		return sprintf( __( 'Enter a date on or before %s.' ), max );
	}
	return isDateUnavailable?.( text ) ? __( 'This date is unavailable.' ) : '';
}

export function serializeRange( value: DateRangeValue | null ): string {
	if ( value === null ) {
		return '';
	}
	return `${ value.from === undefined ? '' : serializeDate( value.from ) }/${ value.to === undefined ? '' : serializeDate( value.to ) }`;
}

export function parseRange( text: string ): DateRangeValue | null | undefined {
	if ( text === '' ) {
		return null;
	}
	const parts = text.split( '/' );
	if ( parts.length !== 2 || parts.every( ( part ) => part === '' ) ) {
		return undefined;
	}
	if ( parts.some( ( part ) => part !== '' && ! parseISODate( part ) ) ) {
		return undefined;
	}
	return { from: parts[ 0 ] || undefined, to: parts[ 1 ] || undefined };
}

export function getRangeError( text: string, constraints: DateConstraints ) {
	if ( text === '' ) {
		return '';
	}
	const range = parseRange( text );
	if ( ! range?.from || ! range.to ) {
		return __( 'Enter both dates in YYYY-MM-DD/YYYY-MM-DD format.' );
	}
	if ( range.from > range.to ) {
		return __( 'The end date must be on or after the start date.' );
	}
	return (
		getDateError( range.from, constraints ) ||
		getDateError( range.to, constraints )
	);
}

export function parseTime(
	text: string,
	precision: TimeInputProps[ 'precision' ]
): string | null | undefined {
	if ( text === '' ) {
		return null;
	}
	const pattern =
		precision === 'second'
			? /^(\d{2}):(\d{2}):(\d{2})$/
			: /^(\d{2}):(\d{2})$/;
	const match = pattern.exec( text );
	return match &&
		Number( match[ 1 ] ) < 24 &&
		Number( match[ 2 ] ) < 60 &&
		Number( match[ 3 ] ?? 0 ) < 60
		? text
		: undefined;
}

export function serializeTime(
	value: string | null,
	precision: TimeInputProps[ 'precision' ]
): string {
	if ( value === null ) {
		return '';
	}
	if ( ! parseTime( value, precision ) ) {
		throw new RangeError(
			'TimeInput: value must be a valid local time in the selected precision, or null.'
		);
	}
	return value;
}

export function getTimeError(
	text: string,
	precision: TimeInputProps[ 'precision' ],
	min?: string,
	max?: string
) {
	if ( text === '' ) {
		return '';
	}
	if ( ! parseTime( text, precision ) ) {
		return precision === 'second'
			? __( 'Enter a valid 24-hour time in HH:mm:ss format.' )
			: __( 'Enter a valid 24-hour time in HH:mm format.' );
	}
	if ( min && text < min ) {
		/* translators: %s: Earliest permitted local time. */
		return sprintf( __( 'Enter a time at or after %s.' ), min );
	}
	if ( max && text > max ) {
		/* translators: %s: Latest permitted local time. */
		return sprintf( __( 'Enter a time at or before %s.' ), max );
	}
	return '';
}
