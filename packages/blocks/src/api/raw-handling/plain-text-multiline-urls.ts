/**
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';

/**
 * Escapes text for safe inclusion in HTML.
 *
 * @param text Text to escape.
 */
function escapeHTML( text: string ): string {
	return text
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
}

/**
 * When plain text contains multiple lines that are each a URL, return HTML
 * with one paragraph per URL so each line can be transformed into its own block
 * (for example, an embed block per link).
 *
 * @param plainText Pasted plain text.
 * @return HTML with one paragraph per URL, or null if not applicable.
 */
export function plainTextToMultilineUrlHTML(
	plainText: string
): string | null {
	const lines = plainText
		.trim()
		.split( /\r?\n/ )
		.map( ( line ) => line.trim() )
		.filter( Boolean );

	if ( lines.length < 2 ) {
		return null;
	}

	const isEmbeddableUrl = ( line: string ) =>
		isURL( line ) &&
		/^https:\/\//i.test( line ) &&
		line.match( /https:\/\//gi )?.length === 1;

	if ( ! lines.every( isEmbeddableUrl ) ) {
		return null;
	}

	return lines.map( ( url ) => `<p>${ escapeHTML( url ) }</p>` ).join( '' );
}
