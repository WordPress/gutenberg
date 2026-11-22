// This clipboard-only marker distinguishes a copied selection's synthetic
// parent wrapper from a parent block that was itself selected.
export const BLOCK_CLIPBOARD_WRAPPER = '<!-- wp-blocks-copy-wrapper -->';

export function stripBlockClipboardWrapper( content: string ): string {
	const leadingWhitespace = content.match( /^\s*/ )![ 0 ].length;
	return content
		.slice( leadingWhitespace )
		.startsWith( BLOCK_CLIPBOARD_WRAPPER )
		? content.slice( leadingWhitespace + BLOCK_CLIPBOARD_WRAPPER.length )
		: content;
}

/**
 * Remove the platform metadata surrounding clipboard HTML.
 *
 * @param html Clipboard HTML.
 * @return HTML without Windows fragment boundaries or Chromium's charset tag.
 */
export function normalizeClipboardHTML( html: string ): string {
	const startStr = '<!--StartFragment-->';
	const startIdx = html.indexOf( startStr );
	if ( startIdx > -1 ) {
		html = html.substring( startIdx + startStr.length );
		const endIdx = html.indexOf( '<!--EndFragment-->' );
		if ( endIdx > -1 ) {
			html = html.substring( 0, endIdx );
		}
	}

	// Chromium inserts this tag; ignore platform padding before it, too.
	// https://github.com/WordPress/gutenberg/issues/33585
	// https://bugs.chromium.org/p/chromium/issues/detail?id=1264616
	return html.replace( /^\s*<meta charset='utf-8'>/, '' );
}
