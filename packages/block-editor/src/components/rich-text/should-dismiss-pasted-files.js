/**
 * Given a collection of DataTransfer files and HTML and plain text strings,
 * determine whether the files are to be dismissed in favor of the HTML.
 *
 * Certain office-type programs, like Microsoft Word or Apple Numbers,
 * will, upon copy, generate a screenshot of the content being copied and
 * attach it to the clipboard alongside the actual rich text that the user
 * sought to copy. In those cases, we should let Gutenberg handle the rich text
 * content and not the screenshot, since this allows Gutenberg to insert
 * meaningful blocks, like paragraphs, lists or even tables.
 *
 * @param {File[]} files File objects obtained from a paste event
 * @param {string} html  HTML content obtained from a paste event
 * @return {boolean}     True if the files should be dismissed
 */
export function shouldDismissPastedFiles( files, html /*, plainText */ ) {
	// The question is only relevant when there is actual HTML content and when
	// there is exactly one image file.
	if (
		html &&
		files?.length === 1 &&
		files[ 0 ].type.indexOf( 'image/' ) === 0
	) {
		// A single <img> tag found in the HTML source suggests that the
		// content being pasted revolves around an image. Sometimes there are
		// other elements found, like <figure>, but we assume that the user's
		// intention is to paste the actual image file.
		const IMAGE_TAG = /<\s*img\b/ig;
		return html.match( IMAGE_TAG )?.length !== 1;
	}

	return false;
}
