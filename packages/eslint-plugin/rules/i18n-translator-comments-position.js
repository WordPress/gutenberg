const {
	TRANSLATION_FUNCTIONS,
	getTranslateFunctionName,
} = require( '../utils' );

/**
 * Matches a translator comment, using the same test as `wp i18n make-pot`:
 * after the comment markers and any leading `*`, the text starts with
 * `translators`.
 */
const REGEXP_TRANSLATOR_COMMENT = /^[\s*]*translators/i;

const REGEXP_STATEMENT = /(Statement|Declaration)$/;

/**
 * Whether a translator comment placed directly before a node survives
 * bundling. Bundlers print from an abstract syntax tree in which comments are
 * untracked trivia, and keep only a comment that leads an expression. A
 * comment leading a statement, a JSX attribute or a JSX child is dropped, and
 * the string then reaches translators without its context.
 *
 * @param {Object|null} node Node the comment leads, or `null` when no node
 *                           starts there, as for a comment alone in a JSX
 *                           expression container.
 * @return {boolean} Whether the position is compatible.
 */
function isCompatiblePosition( node ) {
	if ( ! node || REGEXP_STATEMENT.test( node.type ) ) {
		return false;
	}
	// Elements and fragments are expressions; the other JSX nodes, such as an
	// attribute, are syntax that a comment cannot lead.
	return (
		! node.type.startsWith( 'JSX' ) ||
		node.type === 'JSXElement' ||
		node.type === 'JSXFragment'
	);
}

/**
 * Get the outermost node that starts at an offset.
 *
 * @param {Object} sourceCode Source code object.
 * @param {number} index      Offset into the source.
 * @return {Object|null} Node, or `null` when none starts there.
 */
function getNodeStartingAt( sourceCode, index ) {
	let node = sourceCode.getNodeByRangeIndex( index );
	if ( ! node || node.range[ 0 ] !== index ) {
		return null;
	}
	while (
		node.parent &&
		node.parent.type !== 'Program' &&
		node.parent.range[ 0 ] === index
	) {
		node = node.parent;
	}
	return node;
}

/**
 * Render a comment as a block comment, so that it can be moved into an
 * expression. A `*\/` inside a line comment is broken up so that it cannot end
 * the new block comment early.
 *
 * @param {Object} sourceCode Source code object.
 * @param {Object} comment    Comment node.
 * @return {string} Block comment, with its markers.
 */
function toBlockComment( sourceCode, comment ) {
	if ( comment.type !== 'Line' ) {
		return sourceCode.getText( comment );
	}
	return `/* ${ comment.value.trim().replace( /\*\//g, '* /' ) } */`;
}

/**
 * The range to delete to take a comment out. A comment alone on its line takes
 * the whole line with it, so that removing it leaves no blank line behind.
 *
 * @param {Object} sourceCode Source code object.
 * @param {Object} comment    Comment node.
 * @return {number[]} Range to remove.
 */
function getRemovalRange( sourceCode, comment ) {
	const text = sourceCode.getText();
	let start = comment.range[ 0 ];
	let end = comment.range[ 1 ];

	while ( start > 0 && /[ \t]/.test( text[ start - 1 ] ) ) {
		start--;
	}
	if ( start > 0 && text[ start - 1 ] !== '\n' ) {
		return comment.range;
	}
	while ( /[ \t]/.test( text[ end ] ?? '' ) ) {
		end++;
	}
	return text[ end ] === '\n' ? [ start, end + 1 ] : comment.range;
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		fixable: 'code',
		messages: {
			incompatiblePosition:
				'Translator comment is in a position where bundlers drop it. Move it into the call, before its first argument.',
		},
	},
	create( context ) {
		const sourceCode = context.sourceCode;
		const gettextCalls = [];

		return {
			CallExpression( node ) {
				if (
					TRANSLATION_FUNCTIONS.has(
						getTranslateFunctionName( node.callee )
					) &&
					node.arguments.length > 0
				) {
					gettextCalls.push( node );
				}
			},

			'Program:exit'() {
				gettextCalls.sort( ( a, b ) => a.range[ 0 ] - b.range[ 0 ] );

				for ( const comment of sourceCode.getAllComments() ) {
					if ( ! REGEXP_TRANSLATOR_COMMENT.test( comment.value ) ) {
						continue;
					}

					// The call `make-pot` gives the comment to: the first
					// gettext call that starts after the comment, on the same
					// line or the next, or the call the comment is already in,
					// when it comes before the first argument.
					const call = gettextCalls.find(
						( node ) =>
							( node.range[ 0 ] >= comment.range[ 1 ] &&
								node.loc.start.line - comment.loc.end.line <=
									1 ) ||
							( node.range[ 0 ] < comment.range[ 0 ] &&
								comment.range[ 1 ] <=
									node.arguments[ 0 ].range[ 0 ] )
					);
					if ( ! call ) {
						continue;
					}

					const nextToken = sourceCode.getTokenAfter( comment );
					const led =
						nextToken &&
						getNodeStartingAt( sourceCode, nextToken.range[ 0 ] );
					if ( isCompatiblePosition( led ) ) {
						continue;
					}

					context.report( {
						loc: comment.loc,
						messageId: 'incompatiblePosition',
						fix: ( fixer ) => [
							fixer.removeRange(
								getRemovalRange( sourceCode, comment )
							),
							fixer.insertTextBefore(
								call.arguments[ 0 ],
								`${ toBlockComment( sourceCode, comment ) } `
							),
						],
					} );
				}
			},
		};
	},
};
