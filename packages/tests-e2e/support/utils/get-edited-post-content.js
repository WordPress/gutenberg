/**
 * Regular expression matching zero-width space characters.
 *
 * @type {RegExp}
 */
const REGEXP_ZWSP = /[\u200B\u200C\u200D\uFEFF]/;

/**
 * Returns a promise which resolves with the edited post content (HTML string).
 *
 * @return {Promise} Promise resolving with post content markup.
 */
export async function getEditedPostContent() {
	const content = await page.evaluate( () => {
		const { select } = window.wp.data;
		return select( 'core/editor' ).getEditedPostContent();
	} );

	// Globally guard against zero-width characters.
	if ( REGEXP_ZWSP.test( content ) ) {
		throw new Error( 'Unexpected zero-width space character in editor content.' );
	}

	return content;
}
