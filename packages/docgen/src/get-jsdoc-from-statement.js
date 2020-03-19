/**
 * External dependencies.
 */
const ts = require( 'typescript' );
const { SyntaxKind } = ts;

/**
 * @typedef {import('typescript').Statement} Statement
 */

/**
 * @typedef {import('typescript').TypeChecker} TypeChecker
 */

/**
 * Function that takes a TypeScript statement and returns
 * a object representing the leading JSDoc comment of the statement,
 * if any.
 *
 * @param {Statement} statement TypeScript statement.
 * @param {TypeChecker} typeChecker TypeScript typeChecker.
 *
 * @return {Object} Object representing the JSDoc comment.
 */
module.exports = function( statement, typeChecker ) {
	let jsdoc;
	if ( statement.jsDoc ) {
		const lastComment = statement.jsDoc[ statement.jsDoc.length - 1 ];

		return {
			description: lastComment.comment,
			tags: lastComment.tags.map( ( tag ) => {
				const getType = () =>
					typeChecker.typeToString(
						typeChecker.getTypeFromTypeNode( tag.typeExpression )
					);
				const result = {
					title: tag.tagName.escapedText,
					description: tag.comment ? tag.comment : null,
				};

				if ( tag.kind === SyntaxKind.JSDocParameterTag ) {
					result.name = tag.name.escapedText;
					result.type = getType();
				}

				if (
					tag.kind === SyntaxKind.JSDocReturnTag ||
					tag.kind === SyntaxKind.JSDocTypeTag
				) {
					result.type = getType();
				}

				return result;
			} ),
		};
	}

	return jsdoc;
};
