/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	getTextContentFromNode,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );

const PROBLEMS_BY_CHAR_CODE = {
	9: '\\t',
	10: '\\n',
	13: '\\r',
	32: 'whitespace',
};

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			noLeadingOrTrailingWhitespace:
				'Translations should not contain leading or trailing whitespace{{problem}}',
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
					args
				);

				for ( const arg of candidates ) {
					const argumentString = getTextContentFromNode( arg );
					if ( ! argumentString ) {
						continue;
					}

					const trimmableWhitespace = argumentString.match(
						/^\s|\s$/
					);

					if ( ! trimmableWhitespace ) {
						continue;
					}

					const problem =
						PROBLEMS_BY_CHAR_CODE[
							trimmableWhitespace[ 0 ].charCodeAt( 0 )
						];
					const problemString = problem ? ` (${ problem })` : '';

					context.report( {
						node,
						messageId: 'noLeadingOrTrailingWhitespace',
						data: {
							problem: problemString,
						},
					} );
				}
			},
		};
	},
};
