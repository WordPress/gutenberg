/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * Locale-specific digraph replacements that must run before removeAccents(),
 * mirroring the locale block in PHP's remove_accents() (wp-includes/formatting.php).
 */
const LOCALE_CHAR_MAP: Record< string, Record< string, string > > = {
	de: {
		Ä: 'Ae',
		ä: 'ae',
		Ö: 'Oe',
		ö: 'oe',
		Ü: 'Ue',
		ü: 'ue',
		ẞ: 'SS',
		ß: 'ss',
	},
	da_DK: {
		Æ: 'Ae',
		æ: 'ae',
		Ø: 'Oe',
		ø: 'oe',
		Å: 'Aa',
		å: 'aa',
	},
	ca: { 'l·l': 'll' },
	sr_RS: { Đ: 'DJ', đ: 'dj' },
	bs_BA: { Đ: 'DJ', đ: 'dj' },
};

function getLocaleChars(
	locale: string
): Record< string, string > | undefined {
	// str_starts_with( $locale, 'de' ) covers de_DE, de_CH, de_AT, etc.
	if ( locale.startsWith( 'de' ) ) {
		return LOCALE_CHAR_MAP.de;
	}
	return LOCALE_CHAR_MAP[ locale ];
}

/**
 * Performs some basic cleanup of a string for use as a post slug.
 *
 * This replicates some of what `sanitize_title_with_dashes()` does in WordPress core, but
 * is only designed to approximate what the slug will be.
 *
 * Converts Latin-1 Supplement and Latin Extended-A letters to basic Latin
 * letters. Removes combining diacritical marks. Converts whitespace, periods,
 * and forward slashes to hyphens. Removes any remaining non-word characters
 * except hyphens. Converts remaining string to lowercase. It does not account
 * for octets, HTML entities, or other encoded characters.
 *
 * @param string Title or slug to be processed.
 * @param locale Optional BCP 47 / WordPress locale string (e.g. 'de_DE').
 *               When provided, locale-specific digraph replacements are applied
 *               before generic accent removal, mirroring PHP's remove_accents().
 *
 * @return Processed string.
 */
export function cleanForSlug( string: string, locale = '' ): string {
	if ( ! string ) {
		return '';
	}

	const localeChars = getLocaleChars( locale );
	if ( localeChars ) {
		for ( const [ char, replacement ] of Object.entries( localeChars ) ) {
			string = string.replaceAll( char, replacement );
		}
	}

	return (
		removeAccents( string )
			// Convert &nbsp, &ndash, and &mdash to hyphens.
			.replace( /(&nbsp;|&ndash;|&mdash;)/g, '-' )
			// Convert each group of whitespace, periods, and forward slashes to a hyphen.
			.replace( /[\s\./]+/g, '-' )
			// Remove all HTML entities.
			.replace( /&\S+?;/g, '' )
			// Remove anything that's not a letter, number, underscore or hyphen.
			.replace( /[^\p{L}\p{N}_-]+/gu, '' )
			// Convert to lowercase
			.toLowerCase()
			// Replace multiple hyphens with a single one.
			.replace( /-+/g, '-' )
			// Remove any remaining leading or trailing hyphens.
			.replace( /(^-+)|(-+$)/g, '' )
	);
}
