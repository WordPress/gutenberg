/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

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
 *
 * @return Processed string.
 */
export function cleanForSlug( string: string ): string {
	if ( ! string ) {
		return '';
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
