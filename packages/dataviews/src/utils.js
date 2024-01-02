/**
 * Helper util to sort items by text fields, when sorting is done client side.
 *
 * @param {Object}   params            Function params.
 * @param {Object[]} params.items      Array of items to sort.
 * @param {Object}   params.view       Current view object.
 * @param {Object[]} params.fields     Array of available fields.
 * @param {string[]} params.textFields Array of the field ids to sort.
 *
 * @return {Object[]} Sorted items.
 */
export const sortByTextFields = ( { items, view, fields, textFields } ) => {
	const sortedItems = [ ...items ];
	const fieldId = view.sort.field;
	if ( textFields.includes( fieldId ) ) {
		const fieldToSort = fields.find( ( field ) => {
			return field.id === fieldId;
		} );
		sortedItems.sort( ( a, b ) => {
			const valueA = fieldToSort.getValue( { item: a } ) ?? '';
			const valueB = fieldToSort.getValue( { item: b } ) ?? '';
			return view.sort.direction === 'asc'
				? valueA.localeCompare( valueB )
				: valueB.localeCompare( valueA );
		} );
	}
	return sortedItems;
};

/**
 * Helper util to get the paginated items and the paginateInfo needed,
 * when pagination is done client side.
 *
 * @param {Object}   params       Function params.
 * @param {Object[]} params.items Array of available items.
 * @param {Object}   params.view  Current view object.
 *
 * @return {Object} Paginated items and paginationInfo.
 */
export function getPaginationResults( { items, view } ) {
	const start = ( view.page - 1 ) * view.perPage;
	const totalItems = items?.length || 0;
	items = items?.slice( start, start + view.perPage );
	return {
		items,
		paginationInfo: {
			totalItems,
			totalPages: Math.ceil( totalItems / view.perPage ),
		},
	};
}
