/*eslint no-shadow: ["error", { "allow": ["selector"] }]*/

/**
 * Returns an array of classnames that match a given selector on the current page
 *
 * @param {string} selector The selector to query on the page
 */
export const getElementSelectorList = async ( selector ) => {
	return await page.evaluate( ( selector ) => {
		return Array.from(
			document.querySelectorAll(
				selector
			)
		).map( ( elem ) => elem.className );
	}, selector );
};
