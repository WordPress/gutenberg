const {
	getTextContentFromNode,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );
const {
	getSprintfPlaceholders,
	getSprintfArgumentPositions,
} = require( '../utils/get-sprintf-placeholders' );

const PLURAL_FUNCTIONS = new Set( [ '_n', '_nx' ] );

/**
 * Returns a sorted list of keys identifying the argument and conversion type
 * of each placeholder, so that `%s %d` and `%2$d %1$s` compare as equal.
 *
 * @param {import('../utils/get-sprintf-placeholders').SprintfPlaceholder[]} placeholders Placeholders.
 *
 * @return {string[]} Sorted keys.
 */
function getPlaceholderKeys( placeholders ) {
	const { positions } = getSprintfArgumentPositions( placeholders );

	return placeholders
		.map(
			( { name, type }, index ) =>
				`${ name ?? positions[ index ] }:${ type }`
		)
		.sort();
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			mismatchedPlaceholders:
				'The singular and plural strings should use the same placeholders. Found {{ singular }} in the singular and {{ plural }} in the plural.',
		},
	},
	create( context ) {
		return {
			CallExpression( node ) {
				const { callee, arguments: args } = node;

				const functionName = getTranslateFunctionName( callee );

				if ( ! PLURAL_FUNCTIONS.has( functionName ) ) {
					return;
				}

				const candidates = getTranslateFunctionArgs(
					functionName,
					args,
					false
				);

				if ( candidates.length < 2 ) {
					return;
				}

				const strings = candidates.map( getTextContentFromNode );

				if (
					strings.some( ( string ) => typeof string !== 'string' )
				) {
					return;
				}

				const [ singular, plural ] = strings.map(
					getSprintfPlaceholders
				);

				// A singular string with fewer placeholders, such as
				// `_n( 'One block', '%d blocks', count )`, is a different
				// problem. `valid-sprintf` reports it inside `sprintf()`.
				if ( singular.length < plural.length ) {
					return;
				}

				const singularKeys = getPlaceholderKeys( singular );
				const pluralKeys = getPlaceholderKeys( plural );

				if (
					singularKeys.length === pluralKeys.length &&
					singularKeys.every(
						( key, index ) => key === pluralKeys[ index ]
					)
				) {
					return;
				}

				const format = ( placeholders ) =>
					placeholders.length
						? placeholders.map( ( { raw } ) => raw ).join( ', ' )
						: 'none';

				context.report( {
					node,
					messageId: 'mismatchedPlaceholders',
					data: {
						singular: format( singular ),
						plural: format( plural ),
					},
				} );
			},
		};
	},
};
