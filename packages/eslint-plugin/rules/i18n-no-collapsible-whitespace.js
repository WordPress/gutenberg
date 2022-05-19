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
	32: 'consecutive spaces',
};

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			noCollapsibleWhitespace:
				'Translations should not contain collapsible whitespace{{problem}}',
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

					const collapsibleWhitespace = argumentString.match(
						/(\n|\t|\r| {2})/
					);

					if ( ! collapsibleWhitespace ) {
						continue;
					}

					const problem =
						PROBLEMS_BY_CHAR_CODE[
							collapsibleWhitespace[ 0 ].charCodeAt( 0 )
						];
					const problemString = problem ? ` (${ problem })` : '';

					context.report( {
						node,
						messageId: 'noCollapsibleWhitespace',
						data: {
							problem: problemString,
						},
					} );
				}
			},
		};
	},
};
