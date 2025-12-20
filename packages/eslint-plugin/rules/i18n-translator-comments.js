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
const { REGEXP_COMMENT_PLACEHOLDER } = require( '../utils/constants' );

/**
 * Extracts placeholders from a string.
 *
 * @param {string} str - The string to extract placeholders from.
 * @return {string[]} An array of objects representing the placeholders found in the string.
 */
function extractPlaceholders( str ) {
	const matches = [];
	let match;
	REGEXP_SPRINTF_PLACEHOLDER.lastIndex = 0;

	while ( ( match = REGEXP_SPRINTF_PLACEHOLDER.exec( str ) ) !== null ) {
		const index = match[ 3 ]; // from %1$s
		const name = match[ 5 ]; // from %(name)s
		matches.push( index ?? name ?? match[ 0 ] );
	}
	return matches;
}

/**
 * Extracts translator keys from a comment text.
 *
 * @param {string} commentText - The text of the comment to extract keys from.
 * @return	 {Map<string, boolean>} A set of translator keys found in the comment text.
 */
function extractTranslatorKeys( commentText ) {
	const keys = new Map();
	let match;

	match = commentText.match( /translators:\s*(.*)/i );
	if ( ! match ) {
		return keys;
	}

	const commentBody = match[ 1 ];

	// Match placeholders in the comment body.
	while (
		( match = REGEXP_COMMENT_PLACEHOLDER.exec( commentBody ) ) !== null
	) {
		const rawKey = match[ 1 ];
		const hasColon = match.groups?.colon?.trim() === ':';
		keys.set( rawKey, keys.get( rawKey ) || hasColon );
	}

	return keys;
}

module.exports = {
	meta: {
		type: 'problem',
		messages: {
			missing:
				'Translation function with placeholders is missing preceding translator comment',
			missingKeys:
				'Translator comment missing description(s) for placeholder(s): {{ keys }}.',
			extraPlaceholders:
				'Translator comment has extra placeholder(s): {{ keys }}.',
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
							end: { line: commentLine },
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
						const keysInComment =
							extractTranslatorKeys( commentText );
						const placeholdersUsed =
							candidates.flatMap( extractPlaceholders );

						const keysInCommentArr = [ ...keysInComment.keys() ];

						// Check and filter placeholders that are not present in the comment.
						const missing = placeholdersUsed.filter( ( key ) => {
							// Regex to match the key and its potential formats in the array.
							const regex = new RegExp( `%?${ key }(\\$[sdf])?` );
							return ! keysInCommentArr.some( ( y ) =>
								regex.test( y )
							);
						} );

						if ( missing.length > 0 ) {
							context.report( {
								node,
								messageId: 'missingKeys',
								data: {
									keys: missing.join( ', ' ),
								},
							} );

							return;
						}

						const extra = keysInComment.size
							? [ ...keysInComment.keys() ].filter( ( key ) => {
									const normalizedKey = key.replace(
										/^%/,
										''
									);

									// Only allow numeric or printf-style placeholders
									const isNumbered = /^[0-9]+$/.test(
										normalizedKey
									);
									const isPrintf = [
										'%s',
										'%d',
										'%f',
									].includes( key );

									// Only add if it's not already in allowedUsed
									const isValidType =
										( isNumbered &&
											keysInComment.get(
												normalizedKey
											) ) ||
										isPrintf;
									const isUnused =
										! placeholdersUsed.includes( key ) &&
										! placeholdersUsed.includes(
											normalizedKey
										);

									return isValidType && isUnused;
							  } )
							: [];

						if ( extra.length > 0 ) {
							context.report( {
								node,
								messageId: 'extraPlaceholders',
								data: {
									keys: extra.join( ',' ),
								},
							} );

							return;
						}

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
