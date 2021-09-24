const codeBeforeComment = ( sourceCode, node ) => {
	const prevToken = sourceCode.getTokenBefore( node );
	if ( prevToken && prevToken.loc.end.line === node.loc.start.line ) {
		return true;
	}
};

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			missingPunctuation:
				'Comments must end with a period (.), exclamation mark (!), or question mark (?).',
			missingSpace: 'Comments must have a space after the comment token.',
			capitalLetter: 'Comments must start with a capital letter.',
		},
		fixable: 'code',
	},
	create( context ) {
		const sourceCode = context.getSourceCode();
		return {
			Program( node ) {
				const { comments } = node;
				comments.forEach( ( comment, index ) => {
					// Regex to check if the comment contains an \@see or @todo type directive - any @ sign followed by a word.
					const todoTypeCommentRegex = /@\w*\s/;
					const translatorCommentRegex = /translators:/;

					// Skip block comments that cross multiple lines.
					if (
						comment.type === 'Block' &&
						comment.loc.start.line !== comment.loc.end.line
					) {
						return;
					}
					const { value } = comment;

					// Skip translator or @see/@todo etc. comments
					if (
						value.match( todoTypeCommentRegex ) ||
						value.match( translatorCommentRegex )
					) {
						return;
					}

					const trimmedValue = value.trim();
					const lastChar = trimmedValue.charAt(
						trimmedValue.length - 1
					);

					const previousComment =
						index !== 0 ? comments[ index - 1 ] : null;
					const nextComment =
						index !== comments.length - 1
							? comments[ index + 1 ]
							: null;

					const isFollowedDirectlyByLineComment =
						nextComment &&
						! codeBeforeComment( sourceCode, comment ) &&
						nextComment.type === 'Line' &&
						nextComment.loc.start.line ===
							comment.loc.start.line + 1;
					const isPrecededDirectlyByLineComment =
						previousComment &&
						! codeBeforeComment( sourceCode, comment ) &&
						previousComment.type === 'Line' &&
						previousComment.loc.end.line ===
							comment.loc.start.line - 1;

					// Check to see if the comment starts with a space.
					if ( value.charAt( 0 ) !== ' ' ) {
						context.report( {
							node,
							loc: comment.loc,
							messageId: 'missingSpace',
						} );
					}

					// Check to see if first word starts with a capital letter.
					if (
						! isPrecededDirectlyByLineComment &&
						trimmedValue.charAt( 0 ) !==
							trimmedValue.charAt( 0 ).toUpperCase()
					) {
						context.report( {
							node,
							loc: comment.loc,
							messageId: 'capitalLetter',
						} );
					}

					// Check for correct punctuation.
					if (
						lastChar !== '.' &&
						lastChar !== '!' &&
						lastChar !== '?'
					) {
						// Check if next comment is on the following line, if it is then this rule doesn't count
						// because comments could be formatted over multiple lines like this one is.
						if ( isFollowedDirectlyByLineComment ) {
							return;
						}

						context.report( {
							node,
							loc: comment.loc,
							messageId: 'missingPunctuation',
						} );
					}
				} );
			},
		};
	},
};
