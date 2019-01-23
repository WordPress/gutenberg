/**
 * Binds to the document on page load which throws an error if any warnings had
 * been logged to the page. This assumes both that the server is configured to
 * display warnings, and that the warnings would be output to the page before
 * the `<!doctype>`.
 */
export function observePageWarnings() {
	page.on( 'load', async () => {
		const hasDoctype = await page.evaluate( () => !! document.doctype );

		if ( ! hasDoctype ) {
			throw new Error( 'Unexpected page warnings' );
		}
	} );
}
