/**
 *
 * This function converts a list of comment objects with a `parent` property to
 * a list of comment objects with a `children` property. The `children` property
 * is itself a list of comment objects.
 *
 * @example
 * ```
 * const comments = [
 *		{ commentId: 1, parent: 0 },
 *		{ commentId: 2, parent: 1 },
 *		{ commentId: 3, parent: 2 },
 *		{ commentId: 4, parent: 1 },
 *	]
 * expect( convertToTree( comments ) ).toEqual( [
 *	{
 *		commentId: 1,
 *		children: [
 *			{ commentId: 2, children: [ { commentId: 3, children: [] } ] },
 *			{ commentId: 4, children: [] },
 *			],
 *		},
 *	] );
 * ```
 * @typedef {{commentId: number, parent: number}} Comment
 * @param {Comment[]} data - List of comment objects.
 */
export const convertToTree = ( data ) => {
	const table = {};
	if ( ! data ) return [];

	// First create a hash table of { [commentId]: comment, children: [] }
	data.forEach( ( item ) => {
		table[ item.commentId ] = { ...item, children: [] };
	} );

	const tree = [];

	// Iterate over the original commenta again
	data.forEach( ( item ) => {
		if ( item.parent ) {
			// If the comment has a "parent", then find that parent in the table that
			// we have created above and push the current comment to the array of its
			// children.
			table[ item.parent ].children.push( table[ item.commentId ] );
		} else {
			// Otherwise, if the comment has no parent (also works if parent is 0)
			// that means that it's a top-level comment so we can find it in the table
			// and push it to the final tree.
			tree.push( table[ item.commentId ] );
		}
	} );
	return tree;
};
