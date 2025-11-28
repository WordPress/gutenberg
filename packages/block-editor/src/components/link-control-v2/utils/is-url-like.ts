/**
 * WordPress dependencies
 */
import { isURL as wpIsURL } from '@wordpress/url';

/**
 * Determines if a string looks like a URL.
 *
 * @param val The string to check.
 * @return Whether the string looks like a URL.
 */
export function isURLLike( val: string ): boolean {
	if ( ! val || typeof val !== 'string' ) {
		return false;
	}

	// Check for protocols
	if ( /^[a-z][a-z\d+\-.]*:/i.test( val ) ) {
		return true;
	}

	// Check for www. prefix
	if ( /^www\./i.test( val ) ) {
		return true;
	}

	// Use WordPress URL validation
	return wpIsURL( val );
}

