let identifiers = [];

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
				identifiers = node.tokens.filter(
					( x ) => x.type === 'Identifier'
				);
				comments.forEach( ( comment, index ) => {
					// Return early if this comment is a shebang at the start of a bash script.
					const isShebang =
						sourceCode.lines[ 0 ].indexOf( '#!' ) === 0;
					if ( isShebang ) {
						return;
					}

					// Skip block comments that cross multiple lines.
					if (
						comment.type === 'Block' &&
						comment.loc.start.line !== comment.loc.end.line
					) {
						return;
					}
					const { value } = comment;

					const previousComment =
						index !== 0 ? comments[ index - 1 ] : null;
					const nextComment =
						index !== comments.length - 1
							? comments[ index + 1 ]
							: null;

					const isFollowedDirectlyByLineComment =
						nextComment &&
						nextComment.type === 'Line' &&
						nextComment.loc.start.line ===
							comment.loc.start.line + 1 &&
						! codeBeforeComment( sourceCode, nextComment );
					const isPrecededDirectlyByLineComment =
						previousComment &&
						! codeBeforeComment( sourceCode, comment ) &&
						previousComment.type === 'Line' &&
						previousComment.loc.end.line ===
							comment.loc.start.line - 1;

					// Check to see if the comment starts with a space, or a *.
					if (
						value.length > 0 &&
						value.charAt( 0 ) !== ' ' &&
						value.charAt( 0 ) !== '' &&
						value.charAt( 0 ) !== '*'
					) {
						context.report( {
							node,
							loc: comment.loc,
							messageId: 'missingSpace',
						} );
					}

					// Regex to check if the comment contains an \@see or @todo type directive - any @ sign followed by a word.
					const translatorOrTodoTypeCommentRegex = /translators:|@\w*\s/;

					// Ignore pragmas/compiler hints/shebangs.
					const pragmaRegex = /\$Flow|noinspection\s\S+|istanbul|browserslist|prettier-?\w*|__mocks__\/.*\.js|@ts-(ignore|(no)?check|expect-error)|eslint-(disable|enable)(-next-line)?|globals?\s\S+/;

					// Ignore known common words that don't need to be capitalized.
					// Includes npm, lint, id, v1, v2 etc. (when referring to versions), and the Apple products.
					const commonWordRegex = /^i(Pad|Phone|Mac|OS)|^npm-?\w*|^lint-?\w*|^id|^v\d+/;

					// Ignore if comment contains a URL.
					const regexTests = [
						translatorOrTodoTypeCommentRegex,
						pragmaRegex,
						commonWordRegex,
					];
					const commentMatchesExcludedTypes = regexTests.some(
						( regex ) => {
							return value.match( regex );
						}
					);

					// Skip translator or @see/@todo etc. comments
					if ( commentMatchesExcludedTypes ) {
						return;
					}

					const trimmedValue = value.trim();
					const startsWithURL = trimmedValue.match(
						/^((https?)|(www))\S*/
					);

					// Check to see if first word starts with a capital letter.
					if (
						! startsWithURL &&
						! isPrecededDirectlyByLineComment &&
						trimmedValue.charAt( 0 ) !==
							trimmedValue.charAt( 0 ).toUpperCase()
					) {
						// Check that the comment doesn't start with an identifier used on the line above or below.
						// If it does then allow it to be lower case.
						// This caters for comments describing the code, referring to variables/tokens as they are written.
						const identifiersOnNextOrPreviousLines = identifiers
							.filter(
								( identifier ) =>
									identifier.loc.start.line ===
										comment.loc.start.line + 1 ||
									identifier.loc.start.line ===
										comment.loc.start.line - 1 ||
									identifier.loc.start.line ===
										comment.loc.start.line
							)
							.map( ( identifier ) => identifier.value );

						const trimmedComment = comment.value.trim();
						if (
							! identifiersOnNextOrPreviousLines.some(
								( identifier ) =>
									trimmedComment.indexOf(
										`${ identifier } `
									) === 0
							)
						) {
							context.report( {
								node,
								loc: comment.loc,
								messageId: 'capitalLetter',
							} );
						}
					}
					const endsWithURL = trimmedValue.match(
						/((https?)|(www))\S*\s?$/
					);
					// Check for correct punctuation. Check that last character is a word character (should guard
					// against code comments being flagged). Check if next comment is on the following line, if it is,
					// then this rule doesn't count because comments could be formatted over multiple lines like this
					// one is.
					if (
						! endsWithURL &&
						! trimmedValue.match( /\W$/ ) &&
						! isFollowedDirectlyByLineComment
					) {
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
