/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	REGEXP_SPRINTF_PLACEHOLDER,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
	getTextContentFromNode,
} = require( '../utils' );

module.exports = {
	meta: {
		type: 'problem',
		messages: {
			missing:
				'Translation function with placeholders is missing preceding translator comment',
		},
	},
	create( context ) {
		return {
			CallExpression( node ) {
				const {
					callee,
					loc: {
						start: { line: currentLine },
					},
					parent,
					arguments: args,
				} = node;

				const functionName = getTranslateFunctionName( callee );

				if ( ! TRANSLATION_FUNCTIONS.has( functionName ) ) {
					return;
				}

				const candidates = getTranslateFunctionArgs(
					functionName,
					args
				).map( getTextContentFromNode );

				if ( candidates.filter( Boolean ).length === 0 ) {
					return;
				}

				const hasPlaceholders = candidates.some( ( candidate ) =>
					REGEXP_SPRINTF_PLACEHOLDER.test( candidate )
				);
				// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test#Using_test()_on_a_regex_with_the_global_flag.
				REGEXP_SPRINTF_PLACEHOLDER.lastIndex = 0;

				if ( ! hasPlaceholders ) {
					return;
				}

				const comments = context.getCommentsBefore( node ).slice();

				let parentNode = parent;

				/**
				 * Loop through all parent nodes and get their preceding comments as well.
				 *
				 * This way we can gather comments that are not directly preceding the translation
				 * function call, but are just on the line above it. This case is commonly supported
				 * by string extraction tools like WP-CLI's i18n command.
				 */
				while (
					parentNode &&
					parentNode.type !== 'Program' &&
					Math.abs( parentNode.loc.start.line - currentLine ) <= 1
				) {
					comments.push( ...context.getCommentsBefore( parentNode ) );
					parentNode = parentNode.parent;
				}

				for ( const comment of comments ) {
					const {
						value: commentText,
						loc: {
							start: { line: commentLine },
						},
					} = comment;

					/*
					Skip cases like this:

					// translators: %s: Preference
					console.log(
						sprintf(
							__( 'Preference: %s' ),
							preference
						)
					);
					 */
					if ( Math.abs( commentLine - currentLine ) > 1 ) {
						break;
					}

					if ( /translators:\s*\S+/i.test( commentText ) ) {
						return;
					}
				}

				context.report( {
					node,
					messageId: 'missing',
				} );
			},
		};
	},
};
