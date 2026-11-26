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
 * Returns the source text of a string literal with each unordered placeholder
 * given its position, or `null` if that cannot be done safely.
 *
 * @param {Object} node String literal node.
 *
 * @return {?string} Fixed source text.
 */
function getFixedRaw( node ) {
	if ( node.type !== 'Literal' || typeof node.raw !== 'string' ) {
		return null;
	}

	const valuePlaceholders = getSprintfPlaceholders( node.value );
	const rawPlaceholders = getSprintfPlaceholders( node.raw );

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
		fixable: 'code',
		messages: {
			unorderedPlaceholders:
				'Multiple placeholders in translatable strings should be ordered, such as %1$s and %2$s, so translators can change their order.',
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

					const placeholders = getSprintfPlaceholders( string );

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
						fix: fixedRaw
							? ( fixer ) =>
									fixer.replaceText( candidate, fixedRaw )
							: null,
					} );
				}
			},
		};
	},
};
