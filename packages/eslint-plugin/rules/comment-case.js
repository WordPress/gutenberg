const createFixerFunction = ( errorType, node ) => ( arg ) => {
	const commentType = node.type;
	const commentOpenToken = commentType === 'Line' ? '//' : '/*';
	const commentCloseToken = commentType === 'Line' ? '' : ' */';
	const trimmedComment = node.value.trim();

	switch ( errorType ) {
		case 'missingSpace':
			return arg.replaceText(
				node,
				`${ commentOpenToken } ${ trimmedComment }${ commentCloseToken }`
			);
		case 'missingPunctuation':
			return arg.replaceText(
				node,
				`${ commentOpenToken } ${ trimmedComment }.${ commentCloseToken }`
			);
		case 'capitalLetter':
			return arg.replaceText(
				node,
				`${ commentOpenToken } ${ trimmedComment
					.charAt( 0 )
					.toUpperCase() }${ trimmedComment.substring(
					1
				) }${ commentCloseToken }`
			);
	}
};

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
						const errorType = 'missingSpace';
						context.report( {
							node,
							loc: comment.loc,
							messageId: errorType,
							fix: createFixerFunction( errorType, comment ),
						} );
					}

					// Check to see if first word starts with a capital letter.
					if (
						! isPrecededDirectlyByLineComment &&
						trimmedValue.charAt( 0 ) !==
							trimmedValue.charAt( 0 ).toUpperCase()
					) {
						const errorType = 'capitalLetter';
						context.report( {
							node,
							loc: comment.loc,
							messageId: errorType,
							fix: createFixerFunction( errorType, comment ),
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
						const errorType = 'missingPunctuation';
						context.report( {
							node,
							loc: comment.loc,
							messageId: errorType,
							fix: createFixerFunction( errorType, comment ),
						} );
					}
				} );
			},
		};
	},
};
