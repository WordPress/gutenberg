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
 *
 * @param {Array} data - List of comment objects
 */
export const convertToTree = ( data ) => {
	const table = {};
	if ( ! data ) return [];

	data.forEach( ( item ) => {
		table[ item.commentId ] = { ...item, children: [] };
	} );

	const tree = [];
	data.forEach( ( item ) => {
		if ( item.parent ) {
			table[ item.parent ].children.push( table[ item.commentId ] );
		} else {
			tree.push( table[ item.commentId ] );
		}
	} );
	return tree;
};
