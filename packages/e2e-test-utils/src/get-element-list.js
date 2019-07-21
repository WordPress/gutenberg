/*eslint no-shadow: ["error", { "allow": ["selector"] }]*/

export const getElementSelectorList = async ( selector ) => {
	return await page.evaluate( ( selector ) => {
		// return an array with the classNames of the block toolbar's buttons
		return Array.from(
			document.querySelectorAll(
				selector
			)
		).map( ( elem ) => elem.className );
	}, selector );
};
