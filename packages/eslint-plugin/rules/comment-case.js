const createFixerFunction = ( node ) => ( arg ) => {
	return arg.insertTextAfter( node, '.' );
};

module.exports = {
	meta: {
		type: 'layout',
		schema: [],
		messages: {
			missingPunctuation:
				'Comments must end with a period (.), exclamation mark (!), or question mark (?).',
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

					// Check to see if the comment contains an \@see or @todo type directive.
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
