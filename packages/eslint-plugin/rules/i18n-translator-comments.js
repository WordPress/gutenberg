/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	SPRINTF_PLACEHOLDER_REGEX,
	getTranslateStrings,
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

				const functionName =
					callee.property && callee.property.name
						? callee.property.name
						: callee.name;

				if ( ! TRANSLATION_FUNCTIONS.includes( functionName ) ) {
					return;
				}

				const candidates = getTranslateStrings( functionName, args );

				if ( ! candidates ) {
					return;
				}

				const hasPlaceholders = candidates.some( ( candidate ) =>
					candidate.match( SPRINTF_PLACEHOLDER_REGEX )
				);

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
