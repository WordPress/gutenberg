/**
 * Returns the name of the iframe rendering the given meta box locations.
 *
 * @param {string} location `main` or `side`.
 *
 * @return {string} The iframe name.
 */
export function getMetaBoxesIframeName( location = 'main' ) {
	return location === 'side'
		? 'gutenberg-meta-boxes-side'
		: 'gutenberg-meta-boxes';
}
