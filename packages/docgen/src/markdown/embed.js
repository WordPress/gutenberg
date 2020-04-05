/**
 * External dependencies
 */
const { findLast } = require( 'lodash' );

const getHeadingIndex = ( ast, index ) => {
	const astBeforeIndex = ast.children.slice( 0, index );
	const lastHeading = findLast(
		astBeforeIndex,
		( node ) => node.type === 'heading'
	);
	return lastHeading ? lastHeading.depth : 1;
};

/**
 * Inserts new contents within the token boundaries.
 *
 * @param {string} token String to embed in the start/end tokens.
 * @param {Object} targetAst The remark AST of the file where the new contents are to be embedded.
 * @param {Object} newContentAst The new contents to be embedded in remark AST format.
 * @return {boolean} Whether the contents were embedded or not.
 */
const embed = function( token, targetAst, newContentAst ) {
	let headingIndex = -1;

	const START_TOKEN = `<!-- START TOKEN(${ token }) -->`;
	const END_TOKEN = `<!-- END TOKEN(${ token }) -->`;
	const startIndex = targetAst.children.findIndex(
		( node ) => node.type === 'html' && node.value === START_TOKEN
	);
	if ( startIndex === -1 ) {
		return false;
	}
	const endIndex = targetAst.children.findIndex(
		( node ) => node.type === 'html' && node.value === END_TOKEN
	);
	if ( endIndex === -1 ) {
		return false;
	}

	if ( startIndex !== -1 && endIndex !== -1 && startIndex < endIndex ) {
		headingIndex = getHeadingIndex( targetAst, startIndex );
		newContentAst.children.forEach( ( node ) => {
			if ( node.type === 'heading' ) {
				node.depth = headingIndex + 1;
			}
		} );
		targetAst.children.splice(
			startIndex + 1,
			endIndex - startIndex - 1,
			newContentAst
		);
		return true;
	}
	return false;
};

module.exports = embed;
