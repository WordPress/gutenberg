/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	REGEXP_SPRINTF_PLACEHOLDER,
	getTextContentFromNode,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			noPlaceholdersOnly:
				'Translatable strings should not contain nothing but placeholders',
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

					const modifiedString = argumentString
						.replace( /%%/g, 'VALID_ESCAPED_PERCENTAGE_SIGN' )
						.replace( REGEXP_SPRINTF_PLACEHOLDER, '' );

					if ( modifiedString.length > 0 ) {
						continue;
					}

					context.report( {
						node,
						messageId: 'noPlaceholdersOnly',
					} );
				}
			},
		};
	},
};
