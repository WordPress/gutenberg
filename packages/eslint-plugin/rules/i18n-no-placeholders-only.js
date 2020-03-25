/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	REGEXP_PLACEHOLDER,
	getTextContentFromNode,
	getTranslateFunctionName,
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

				if ( ! TRANSLATION_FUNCTIONS.includes( functionName ) ) {
					return;
				}

				const functionArgs = [ args[ 0 ] ];

				if ( [ '_n', '_nx' ].includes( functionName ) ) {
					functionArgs.push( args[ 1 ] );
				}

				for ( const arg of functionArgs ) {
					const argumentString = getTextContentFromNode( arg );
					if ( ! argumentString ) {
						continue;
					}

					const modifiedString = argumentString.replace(
						REGEXP_PLACEHOLDER,
						''
					);

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
