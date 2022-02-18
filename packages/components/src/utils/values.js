/* eslint-disable jsdoc/valid-types */
/**
 * Determines if a value is null or undefined.
 *
 * @template T
 *
 * @param {T | null | undefined} value The value to check.
 * @return {value is T} Whether value is not null or undefined.
 */
export function isValueDefined( value ) {
	return value !== undefined && value !== null;
}
/* eslint-enable jsdoc/valid-types */

/* eslint-disable jsdoc/valid-types */
/**
 * Determines if a value is empty, null, or undefined.
 *
 * @template T
 *
 * @param {T | "" | null | undefined} value The value to check.
 * @return {value is "" | null | undefined} Whether value is empty.
 */
export function isValueEmpty( value ) {
	const isEmptyString = value === '';

	return ! isValueDefined( value ) || isEmptyString;
}
/* eslint-enable jsdoc/valid-types */

/**
 * Get the first defined/non-null value from an array.
 *
 * @template T
 *
 * @param {Array<T | null | undefined>} values        Values to derive from.
 * @param {T}                           fallbackValue Fallback value if there are no defined values.
 * @return {T} A defined value or the fallback value.
 */
export function getDefinedValue( values = [], fallbackValue ) {
	return values.find( isValueDefined ) ?? fallbackValue;
}

/**
 * @param {string} [locale]
 * @return {[RegExp, RegExp]} The delimiter and decimal regexp
 */
const getDelimiterAndDecimalRegex = ( locale ) => {
	const formatted = Intl.NumberFormat( locale ).format( 1000.1 );
	const delimiter = formatted[ 1 ];
	const decimal = formatted[ formatted.length - 2 ];
	return [
		new RegExp( `\\${ delimiter }`, 'g' ),
		new RegExp( `\\${ decimal }`, 'g' ),
	];
};

// https://en.wikipedia.org/wiki/Decimal_separator#Current_standards
const INTERNATIONAL_THOUSANDS_DELIMITER = / /g;

const ARABIC_NUMERAL_LOCALES = [ 'ar', 'fa', 'ur', 'ckb', 'ps' ];

const EASTERN_ARABIC_NUMBERS = /([۰-۹]|[٠-٩])/g;

/**
 * Checks to see if a value is a numeric value (`number` or `string`).
 *
 * Intentionally ignores whether the thousands delimiters are only
 * in the thousands marks.
 *
 * @param {any}    value
 * @param {string} [locale]
 * @return {boolean} Whether value is numeric.
 */
export function isValueNumeric( value, locale = window.navigator.language ) {
	if ( ARABIC_NUMERAL_LOCALES.some( ( l ) => locale.startsWith( l ) ) ) {
		locale = 'en-GB';
		if ( EASTERN_ARABIC_NUMBERS.test( value ) ) {
			value = value
				.replace( /[٠-٩]/g, ( /** @type {string} */ d ) =>
					'٠١٢٣٤٥٦٧٨٩'.indexOf( d )
				)
				.replace( /[۰-۹]/g, ( /** @type {string} */ d ) =>
					'۰۱۲۳۴۵۶۷۸۹'.indexOf( d )
				)
				.replace( /٬/g, ',' )
				.replace( /٫/g, '.' );
		}
	}

	const [ delimiterRegexp, decimalRegexp ] = getDelimiterAndDecimalRegex(
		locale
	);
	const valueToCheck =
		typeof value === 'string'
			? value
					.replace( delimiterRegexp, '' )
					.replace( decimalRegexp, '.' )
					.replace( INTERNATIONAL_THOUSANDS_DELIMITER, '' )
			: value;
	return ! isNaN( parseFloat( valueToCheck ) ) && isFinite( valueToCheck );
}
