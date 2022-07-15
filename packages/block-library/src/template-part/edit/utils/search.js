/**
 * Filters an item list given a search term.
 *
 * @param {Array}  items       Item list
 * @param {string} searchValue Search input.
 *
 * @return {Array} Filtered item list.
 */
export function searchItems( items, searchValue ) {
	if ( ! searchValue ) {
		return items;
	}

	const normalizedSearchValue = searchValue.toLowerCase();
	return items.filter( ( item ) => {
		const normalizedTitle = item.title.toLowerCase();

		return normalizedTitle.includes( normalizedSearchValue );
	} );
}
