/**
 * External dependencies
 */
import { deburr, toLower, trim } from 'lodash';

/**
 * Performs some basic cleanup of a string for use as a post slug.
 *
 * This replicates some of what `sanitize_title()` does in WordPress core, but
 * is only designed to approximate what the slug will be.
 *
 * Converts whitespace, periods, forward slashes and underscores to hyphens.
 * Converts Latin-1 Supplement and Latin Extended-A letters to basic Latin
 * letters. Removes combining diacritical marks. Converts remaining string
 * to lowercase. It does not touch octets, HTML entities, or other encoded
 * characters.
 *
 * @param {string} string Title or slug to be processed.
 *
 * @return {string} Processed string.
 */
export function cleanForSlug( string ) {
	if ( ! string ) {
		return '';
	}
	return toLower( deburr( trim( string.replace( /[\s\./_]+/g, '-' ), '-' ) ) );
}
