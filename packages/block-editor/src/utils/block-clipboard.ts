// This clipboard-only marker distinguishes a copied selection's synthetic
// parent wrapper from a parent block that was itself selected.
// Keep it inside the delimiter so parsers unaware of this marker ignore the
// unknown attribute instead of creating a Classic block before the wrapper.
export const BLOCK_CLIPBOARD_WRAPPER = '"__wpClipboardWrapper":true';

export function addBlockClipboardWrapper( content: string ): string {
	return content.replace(
		/^(\s*<!-- wp:[^\s>]+) (?:(\{\})|(\{))?/,
		(
			_,
			opening: string,
			emptyAttributes?: string,
			attributes?: string
		) => {
			if ( attributes ) {
				return `${ opening } {${ BLOCK_CLIPBOARD_WRAPPER },`;
			}
			return `${ opening } {${ BLOCK_CLIPBOARD_WRAPPER }}${
				emptyAttributes ? '' : ' '
			}`;
		}
	);
}

export function stripBlockClipboardWrapper( content: string ): string {
	// Only consume our first attribute. Preserve serialized JSON escapes rather
	// than parsing and re-encoding values containing HTML-comment delimiters.
	return content.replace(
		/^(\s*<!-- wp:[^\s>]+) \{"__wpClipboardWrapper":true(,|\} )/,
		( _, opening: string, separator: string ) =>
			`${ opening } ${ separator === ',' ? '{' : '' }`
	);
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
