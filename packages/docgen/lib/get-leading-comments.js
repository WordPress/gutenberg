/**
 * Function that returns the leading comment
 * of an AST node.
 *
 * @param {import('@babel/types').Node} declaration AST node to inspect
 *
 * @return {string | undefined} Leading comment or undefined if there is none.
 */
module.exports = ( declaration ) => {
	let comments;
	if ( declaration.leadingComments ) {
		const lastComment =
			declaration.leadingComments[
				declaration.leadingComments.length - 1
			];
		if ( lastComment ) {
			comments = lastComment.value;
		}
	}
	return comments;
};
