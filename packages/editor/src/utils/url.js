/**
 * WordPress dependencies
 */
import { cleanForSlug as urlCleanForSlug } from '@wordpress/url';
import deprecated from '@wordpress/deprecated';

/**
 * Performs some basic cleanup of a string for use as a post slug
 *
 * This replicates some of what sanitize_title() does in WordPress core, but
 * is only designed to approximate what the slug will be.
 *
 * Converts Latin-1 Supplement and Latin Extended-A letters to basic Latin letters.
 * Removes combining diacritical marks. Converts whitespace, periods,
 * and forward slashes to hyphens. Removes any remaining non-word characters
 * except hyphens and underscores. Converts remaining string to lowercase.
 * It does not account for octets, HTML entities, or other encoded characters.
 *
 * @param {string} string Title or slug to be processed
 *
 * @return {string} Processed string
 */
export function cleanForSlug( string ) {
	deprecated( 'wp.editor.cleanForSlug', {
		since: '12.7',
		plugin: 'Gutenberg',
		alternative: 'wp.url.cleanForSlug',
	} );
	return urlCleanForSlug( string );
}
