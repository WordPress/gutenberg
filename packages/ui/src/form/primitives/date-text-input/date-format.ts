import { parseISODate } from './date-model';

// Direction marks belong to the display, but need not be typed or pasted.
const withoutDirectionMarks = ( text: string ) =>
	text.replace( /[\u200e\u200f\u061c\u2066-\u2069]/g, '' );

/**
 * Numeric Gregorian date formatting and strict parsing for an Intl locale.
 * @param locale Locale used for the displayed date.
 */
export function createDateFormat( locale?: string ) {
	const formatter = new Intl.DateTimeFormat( locale, {
		calendar: 'gregory',
		timeZone: 'UTC',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	} );
	const { numberingSystem } = formatter.resolvedOptions();
	const number = new Intl.NumberFormat( locale, {
		numberingSystem,
		useGrouping: false,
	} );
	const yearNumber = new Intl.NumberFormat( locale, {
		numberingSystem,
		useGrouping: false,
		minimumIntegerDigits: 4,
	} );
	const digits = Array.from( { length: 10 }, ( _, index ) =>
		number.format( index )
	);
	const parts = formatter.formatToParts( new Date( '2006-11-22T00:00:00Z' ) );
	const fields = parts
		.filter( ( part ) => part.type !== 'literal' )
		.map( ( part ) => part.type );
	const tokens: Record< string, string > = {
		year: 'YYYY',
		month: 'MM',
		day: 'DD',
	};
	const placeholder = parts
		.map( ( part ) => tokens[ part.type ] ?? part.value )
		.join( '' );
	const pattern = new RegExp(
		'^' +
			parts
				.map( ( part ) => {
					if ( part.type !== 'literal' ) {
						return part.type === 'year' ? '(\\d{4})' : '(\\d{2})';
					}
					return withoutDirectionMarks( part.value )
						.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' )
						.replace( /\s+/g, '\\s*' );
				} )
				.join( '' ) +
			'$'
	);

	return {
		placeholder,
		format( value: string | null ) {
			if ( value === null ) {
				return '';
			}
			return formatter
				.formatToParts( new Date( `${ value }T00:00:00Z` ) )
				.map( ( part ) =>
					part.type === 'year'
						? yearNumber.format( Number( value.slice( 0, 4 ) ) )
						: part.value
				)
				.join( '' );
		},
		parse( text: string ): string | null | undefined {
			if ( text === '' ) {
				return null;
			}
			let normalized = withoutDirectionMarks( text ).trim();
			digits.forEach( ( digit, index ) => {
				normalized = normalized.split( digit ).join( String( index ) );
			} );
			const match = pattern.exec( normalized );
			if ( ! match ) {
				return undefined;
			}
			const values = Object.fromEntries(
				fields.map( ( field, index ) => [
					field,
					match[ index + 1 ].padStart(
						field === 'year' ? 4 : 2,
						'0'
					),
				] )
			);
			return (
				parseISODate(
					`${ values.year }-${ values.month }-${ values.day }`
				) ?? undefined
			);
		},
	};
}
