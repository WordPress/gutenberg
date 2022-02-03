/**
 *
 * This function converts a flat list of comment objects with a `parent` property
 * to a nested list of comment objects with a `children` property. The `children`
 * property is itself a list of comment objects.
 *
 * @example
 * ```
 * const comments = [
 * 	{ id: 1, parent: 0 },
 * 	{ id: 2, parent: 1 },
 * 	{ id: 3, parent: 2 },
 * 	{ id: 4, parent: 1 },
 * ];
 * expect( convertToTree( comments ) ).toEqual( [
 * 	{
 * 		commentId: 1,
 * 		children: [
 * 			{ commentId: 2, children: [ { commentId: 3, children: [] } ] },
 * 			{ commentId: 4, children: [] },
 * 		],
 * 	},
 * ] );
 * ```
 * @typedef {{id: number, parent: number}} Comment
 * @param {Comment[]} data - List of comment objects.
 *
 * @return {Object[]} Nested list of comment objects with a `children` property.
 */
export const convertToTree = ( data ) => {
	const table = {};
	if ( ! data ) return [];

	// First create a hash table of { [id]: { ...comment, children: [] }}
	data.forEach( ( item ) => {
		table[ item.id ] = { commentId: item.id, children: [] };
	} );

	const tree = [];

	// Iterate over the original comments again
	data.forEach( ( item ) => {
		if ( item.parent ) {
			// If the comment has a "parent", then find that parent in the table that
			// we have created above and push the current comment to the array of its
			// children.
			table[ item.parent ]?.children.push( table[ item.id ] );
		} else {
			// Otherwise, if the comment has no parent (also works if parent is 0)
			// that means that it's a top-level comment so we can find it in the table
			// and push it to the final tree.
			tree.push( table[ item.id ] );
		}
	} );
	return tree;
};
