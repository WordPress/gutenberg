/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * Sanitizes the search input string.
 *
 * Kept local to `icon-picker-modal` to avoid cross-package imports.
 *
 * @param {string} input The search input to normalize.
 *
 * @return {string} The normalized search input.
 */
export default function normalizeSearchInput( input = '' ) {
	// Disregard diacritics.
	input = removeAccents( input );

	// Trim & Lowercase.
	input = input.trim().toLowerCase();

	return input;
}
