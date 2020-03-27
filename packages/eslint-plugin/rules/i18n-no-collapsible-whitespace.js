/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	getTextContentFromNode,
	getTranslateFunctionName,
} = require( '../utils' );

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

				const functionArgs = [ args[ 0 ] ];

				if ( [ '_n', '_nx' ].includes( functionName ) ) {
					functionArgs.push( args[ 1 ] );
				}

				const problemsByCharCode = {
					9: '\\t',
					10: '\\n',
					13: '\\r',
					32: 'consecutive spaces',
				};

				for ( const arg of functionArgs ) {
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
						problemsByCharCode[
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
