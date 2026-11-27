const {
	TRANSLATION_FUNCTIONS,
	getTextContentFromNode,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );
const {
	getSprintfPlaceholders,
} = require( '../utils/get-sprintf-placeholders' );

/**
 * Returns the placeholders in a translatable string, leaving out matches with
 * a space flag: in translatable strings, these are almost always plain text,
 * such as "50% done".
 *
 * @param {string} string Translatable string.
 *
 * @return {import('../utils/get-sprintf-placeholders').SprintfPlaceholder[]} Placeholders.
 */
function getPlaceholders( string ) {
	return getSprintfPlaceholders( string ).filter(
		( placeholder ) => ! placeholder.hasSpaceFlag
	);
}

/**
 * Returns the source text of a string literal with each unordered placeholder
 * given its position, or `null` if that cannot be done safely.
 *
 * @param {Object} node String literal node.
 *
 * @return {?string} Fixed source text.
 */
function getFixedRaw( node ) {
	// Escape sequences, such as `\x25` for `%`, can hide or create
	// placeholders in the source text, so only plain literals are fixed.
	if (
		node.type !== 'Literal' ||
		typeof node.raw !== 'string' ||
		node.raw.includes( '\\' )
	) {
		return null;
	}

	const valuePlaceholders = getPlaceholders( node.value );
	const rawPlaceholders = getPlaceholders( node.raw );

	// Only fix strings where every placeholder is unordered: when ordered
	// and unordered placeholders are mixed, which argument each unordered
	// placeholder refers to is ambiguous.
	if (
		rawPlaceholders.length !== valuePlaceholders.length ||
		rawPlaceholders.some(
			( placeholder ) =>
				placeholder.isOrdered || placeholder.hasStarPrecision
		)
	) {
		return null;
	}

	let fixed = '';
	let lastIndex = 0;
	rawPlaceholders.forEach( ( placeholder, index ) => {
		fixed +=
			node.raw.slice( lastIndex, placeholder.start ) +
			`%${ index + 1 }$` +
			placeholder.raw.slice( 1 );
		lastIndex = placeholder.end;
	} );

	return fixed + node.raw.slice( lastIndex );
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		hasSuggestions: true,
		messages: {
			unorderedPlaceholders:
				'Multiple placeholders in translatable strings should be ordered, such as %1$s and %2$s, so translators can change their order.',
			numberPlaceholders:
				'Number the placeholders in the order they appear. This changes the string, so existing translations of it are lost.',
		},
	},
	create( context ) {
		return {
			CallExpression( node ) {
				const { callee, arguments: args } = node;

				const functionName = getTranslateFunctionName( callee );

				if ( ! TRANSLATION_FUNCTIONS.has( functionName ) ) {
					return;
				}

				const candidates = getTranslateFunctionArgs(
					functionName,
					args,
					false
				);

				for ( const candidate of candidates ) {
					if ( ! candidate ) {
						continue;
					}

					const string = getTextContentFromNode( candidate );

					if ( typeof string !== 'string' ) {
						continue;
					}

					const placeholders = getPlaceholders( string );

					if (
						placeholders.length < 2 ||
						placeholders.every(
							( placeholder ) => placeholder.isOrdered
						)
					) {
						continue;
					}

					const fixedRaw = getFixedRaw( candidate );

					context.report( {
						node: candidate,
						messageId: 'unorderedPlaceholders',
						suggest: fixedRaw
							? [
									{
										messageId: 'numberPlaceholders',
										fix: ( fixer ) =>
											fixer.replaceText(
												candidate,
												fixedRaw
											),
									},
								]
							: [],
					} );
				}
			},
		};
	},
};
