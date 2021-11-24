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
