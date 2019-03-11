/**
 * Selects all text within the current active element field. Throws if there is
 * no active element.
 *
 * This serves as a temporary solution to a bug present as of Puppeteer 1.6.1
 * in which the Cmd+A keyboard combination does not work correctly in macOS
 * environments. Once the bug is resolved, the utility will be removed.
 *
 * @link https://github.com/GoogleChrome/puppeteer/issues/1313
 *
 * @return {Promise} Promise resolving once active element selected.
 */
export async function __unstableSelectAll() {
	await page.evaluate( () => document.execCommand( 'selectall', false, null ) );
}
