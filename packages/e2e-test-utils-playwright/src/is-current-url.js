/**
 * Checks if current URL is a WordPress path.
 *
 * @this {import('./').TestUtils}
 * @param {string}  WPPath String to be serialized as pathname.
 * @param {?string} query  String to be serialized as query portion of URL.
 * @return {boolean} Boolean represents whether current URL is or not a WordPress path.
 */
export function isCurrentURL( WPPath, query = '' ) {
	const currentURL = new URL( this.page.url() );

	currentURL.search = query;

	return this.createURL( WPPath, query ) === currentURL.href;
}
