/**
 * External dependencies
 */
import diff from 'fast-diff';

/**
 * Based on the plain text version, inject any missing spaces into the HTML.
 * Some browsers omit spaces at the edges of text nodes which can result in
 * words being pressed together.
 *
 * @param {string} HTML      HTML with potentially missing spaces.
 * @param {string} plainText Plain text version.
 *
 * @return {string} HTML including any missing spaces.
 */
export default function( HTML, plainText ) {
	return diff( HTML, plainText ).map( ( [ operation, content ] ) => {
		// Pieces of text that appear in the plain text but not in the HTML.
		if ( operation === diff.INSERT ) {
			// Leave any extra spaces that appear in plain text.
			return /^ +$/.test( content ) ? content : '';
		}

		return content;
	} ).join( '' );
}
