import removeAccents from 'remove-accents';

/**
 * All unicode characters that we consider "dash-like":
 * - `\u007e`: ~ (tilde)
 * - `\u00ad`: ­ (soft hyphen)
 * - `\u2053`: ⁓ (swung dash)
 * - `\u207b`: ⁻ (superscript minus)
 * - `\u208b`: ₋ (subscript minus)
 * - `\u2212`: − (minus sign)
 * - `\\p{Pd}`: any other Unicode dash character
 */
const ALL_UNICODE_DASH_CHARACTERS = new RegExp(
	/[\u007e\u00ad\u2053\u207b\u208b\u2212\p{Pd}]/gu
);

export const normalizeTextString = ( value: string ): string => {
	return removeAccents( value )
		.normalize( 'NFKC' )
		.toLocaleLowerCase()
		.replace( ALL_UNICODE_DASH_CHARACTERS, '-' );
};
