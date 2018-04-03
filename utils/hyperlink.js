/**
 * Utility used to check if URL doesn't start with http:, http:, ? # or /, prepend http://
 *
 * @param {string} link Hyperlink to correct.
 * @return {string} Hyperlink corrected.
 */

export function correctLink( link ) {
	let correctedLink = link;

	if ( ! /^(?:[a-z]+:|#|\?|\.|\/)/.test( link ) ) {
		correctedLink = 'http://' + link;
	}

	return correctedLink;
}
