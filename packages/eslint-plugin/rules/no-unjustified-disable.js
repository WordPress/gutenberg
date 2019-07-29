/**
 * Regular expression pattern matching an ESLint disable inline configuration
 * comment value.
 *
 * @type {RegExp}
 */
const REGEXP_DISABLE_ESLINT = /^\s*eslint-disable/;

/**
 * Regular expression pattern matching a disable reason comment value.
 *
 * @type {RegExp}
 */
const REGEXP_DISABLE_REASON = /^[\s*]*Disable [Rr]eason:/;

module.exports = {
	meta: {
		type: 'problem',
		fixable: true,
	},
	create( context ) {
		function validateCommentNode( node, i, allNodes ) {
			if ( ! REGEXP_DISABLE_ESLINT.test( node.value ) ) {
				return;
			}

			let precedingIndex = i;
			let precedingComment;
			while ( ( precedingComment = allNodes[ --precedingIndex ] ) ) {
				// If exhausted preceding comments, there was no justification.
				if ( ! precedingComment ) {
					break;
				}

				// Working backwards, assume that the preceding comment must be
				// one or two lines from the disabling, and at most one line
				// from the previous comment line considered.
				const { line } = precedingComment.loc.end;
				if (
					allNodes[ precedingIndex + 1 ].loc.end.line !== line + 1 &&
					node.loc.start.line !== line + 2
				) {
					break;
				}

				// Reset consideration if encountering another disable.
				if ( REGEXP_DISABLE_ESLINT.test( precedingComment.value ) ) {
					break;
				}

				// If this point is reached and justification is found, short-
				// cut the entire validation as successful.
				if ( REGEXP_DISABLE_REASON.test( precedingComment.value ) ) {
					return;
				}
			}

			context.report( {
				node,
				message: 'Justify disable with preceding "Disable reason:" comment.',
				fix( fixer ) {
					return fixer.insertTextBefore(
						node,
						'// Disable Reason: [Provide justification that the rule is not applicable].\n\n'
					);
				},
			} );
		}

		return {
			Program() {
				context
					.getSourceCode()
					.getAllComments()
					.forEach( validateCommentNode );
			},
		};
	},
};
