const createFixerFunction = ( errorType, node ) => ( arg ) => {
	switch ( errorType ) {
		case 'missingSpace':
			return arg.replaceText( node, `// ${ node.value }` );
		case 'missingPunctuation':
			return arg.insertTextAfter( node, '.' );
		case 'capitalLetter':
			const trimmedComment = node.value.trim();
			return arg.replaceText(
				node,
				`// ${ trimmedComment
					.charAt( 0 )
					.toUpperCase() }${ trimmedComment.substring( 1 ) }`
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
		return {
			Program( node ) {
				const { comments } = node;
				comments.forEach( ( comment, index ) => {
					if ( comment.type !== 'Line' ) {
						return;
					}
					const { value } = comment;
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

					const todoTypeCommentRegex = /@\w*\s/;
					if (
						! trimmedValue.match( todoTypeCommentRegex ) &&
						lastChar !== '.' &&
						lastChar !== '!' &&
						lastChar !== '?'
					) {
						if (
							index + 1 !== comments.length &&
							comments[ index + 1 ].type === 'Line' &&
							comments[ index + 1 ].loc.start.line ===
								comment.loc.start.line + 1
						) {
							// Check if next comment is on the following line, if it is then this rule doesn't count
							// because comments could be formatted like this.
							return;
						}
						context.report( {
							node,
							loc: comment.loc,
							messageId: 'missingPunctuation',
							fix: createFixerFunction( comment ),
						} );
					}
				} );
			},
		};
	},
};
