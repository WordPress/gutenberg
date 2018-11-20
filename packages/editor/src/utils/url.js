/**
 * External dependencies
 */
import { deburr, toLower, trim } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Returns the URL of a WPAdmin Page.
 *
 * TODO: This should be moved to a module less specific to the editor.
 *
 * @param {string} page  Page to navigate to.
 * @param {Object} query Query Args.
 *
 * @return {string} WPAdmin URL.
 */
export function getWPAdminURL( page, query ) {
	return addQueryArgs( page, query );
}

/**
 * Performs some basic cleanup of a string for use as a post slug
 *
 * This replicates some of what santize_title() does in WordPress core, but
 * is only designed to approximate what the slug will be.
 *
 * Converts whitespace, periods, forward slashes and underscores to hyphens.
 * Converts Latin-1 Supplement and Latin Extended-A letters to basic Latin
 * letters. Removes combining diacritical marks. Converts remaining string
 * to lowercase. It does not touch octets, HTML entities, or other encoded
 * characters.
 *
 * @param {string} string Title or slug to be processed
 *
 * @return {string} Processed string
 */
export function cleanForSlug( string ) {
	return toLower( deburr( trim( string.replace( /[\s\./_]+/g, '-' ), '-' ) ) );
}
