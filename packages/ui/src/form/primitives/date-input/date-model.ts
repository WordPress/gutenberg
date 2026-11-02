export type DatePart = 'year' | 'month' | 'day';
export type DateDraft = Record< DatePart, string >;

export function daysInMonth( year: number, month: number ) {
	if ( month === 2 ) {
		return year % 4 === 0 && ( year % 100 !== 0 || year % 400 === 0 )
			? 29
			: 28;
	}
	return [ 4, 6, 9, 11 ].includes( month ) ? 30 : 31;
}

export function getDateValue( draft: DateDraft | null ): string | null {
	if (
		! draft ||
		! /^\d{1,4}$/.test( draft.year ) ||
		! /^\d{1,2}$/.test( draft.month ) ||
		! /^\d{1,2}$/.test( draft.day )
	) {
		return null;
	}
	const year = Number( draft.year );
	const month = Number( draft.month );
	const day = Number( draft.day );
	if (
		year < 1 ||
		year > 9999 ||
		month < 1 ||
		month > 12 ||
		day < 1 ||
		day > daysInMonth( year, month )
	) {
		return null;
	}
	return `${ String( year ).padStart( 4, '0' ) }-${ String( month ).padStart( 2, '0' ) }-${ String( day ).padStart( 2, '0' ) }`;
}

export function parseDateValue( value: string | null ): DateDraft {
	if ( value === null ) {
		return { year: '', month: '', day: '' };
	}
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec( value );
	const draft = match
		? {
				year: String( Number( match[ 1 ] ) ),
				month: String( Number( match[ 2 ] ) ),
				day: String( Number( match[ 3 ] ) ),
			}
		: null;
	if ( ! draft || getDateValue( draft ) !== value ) {
		throw new RangeError(
			'DateInput: value must be a valid YYYY-MM-DD calendar date or null.'
		);
	}
	return draft;
}

export function getDateParts( locale: string ) {
	return new Intl.DateTimeFormat( locale, {
		calendar: 'gregory',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		timeZone: 'UTC',
	} ).formatToParts( new Date( '2026-11-22T00:00:00Z' ) );
}

const stripDirectionMarks = ( value: string ) =>
	value.replace( /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '' );

export function normalizeDigits( value: string, locale: string ) {
	const formatter = new Intl.NumberFormat( locale, { useGrouping: false } );
	const digits = Array.from( { length: 10 }, ( _, index ) =>
		formatter.format( index )
	);
	return Array.from( stripDirectionMarks( value.normalize( 'NFKC' ) ) )
		.map( ( character ) => {
			const digit = digits.indexOf( character );
			return digit < 0 ? character : String( digit );
		} )
		.join( '' );
}

export function formatDigits( value: string, locale: string ) {
	return value === ''
		? ''
		: new Intl.NumberFormat( locale, {
				useGrouping: false,
				minimumIntegerDigits: value.length,
			} ).format( Number( value ) );
}

/**
 * Parse only complete ISO or locale-ordered numeric dates, retaining invalid drafts.
 * @param text
 * @param locale
 */
export function parseDatePaste(
	text: string,
	locale: string
): DateDraft | null {
	const normalized = normalizeDigits( text, locale ).trim();
	const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec( normalized );
	if ( iso ) {
		return { year: iso[ 1 ], month: iso[ 2 ], day: iso[ 3 ] };
	}
	const pattern = getDateParts( locale )
		.map( ( part ) => {
			if ( part.type === 'year' ) {
				return '(?<year>\\d{4})';
			}
			if ( part.type === 'month' || part.type === 'day' ) {
				return `(?<${ part.type }>\\d{1,2})`;
			}
			return stripDirectionMarks( part.value )
				.normalize( 'NFKC' )
				.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' )
				.replace( /\s+/g, '\\s*' );
		} )
		.join( '' );
	const match = new RegExp( `^${ pattern }$` ).exec( normalized );
	return match?.groups
		? {
				year: match.groups.year,
				month: match.groups.month,
				day: match.groups.day,
			}
		: null;
}
