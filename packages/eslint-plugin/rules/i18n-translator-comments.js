/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	REGEXP_PLACEHOLDER,
	getTranslateStrings,
} = require( '../util' );

module.exports = {
	meta: {
		type: 'problem',
		messages: {
			missing:
				'Translation function is missing preceding translator comment',
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
				if ( ! TRANSLATION_FUNCTIONS.includes( callee.name ) ) {
					return;
				}

				const candidates = getTranslateStrings( callee.name, args );

				if ( ! candidates ) {
					return;
				}

				let hasPlaceholders = false;

				for ( const candidate of candidates ) {
					if ( candidate.match( REGEXP_PLACEHOLDER ) ) {
						hasPlaceholders = true;
						break;
					}
				}

				if ( ! hasPlaceholders ) {
					return;
				}

				const comments = [];

				comments.push( ...context.getCommentsBefore( node ) );

				let parentNode = parent;

				while (
					parentNode &&
					Math.abs( parentNode.loc.start.line - currentLine ) <= 1
				) {
					comments.push( ...context.getCommentsBefore( parentNode ) );
					parentNode = parentNode.parent;
				}

				for ( const comment of comments.filter( Boolean ) ) {
					const {
						value: commentText,
						loc: {
							start: { line: commentLine },
						},
					} = comment;

					if ( Math.abs( commentLine - currentLine ) > 1 ) {
						continue;
					}

					if ( commentText.trim().match( /translators: /i ) ) {
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
