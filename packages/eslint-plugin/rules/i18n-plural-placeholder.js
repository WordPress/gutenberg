const {
	REGEXP_SPRINTF_PLACEHOLDER,
	getTextContentFromNode,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );

const PLURAL_FUNCTIONS = new Set( [ '_n', '_nx' ] );

const REGEXP_SELF_CLOSING_TAG = /<[a-zA-Z][\w-]*\s*\/>/;

function hasPlaceholder( string ) {
	return (
		REGEXP_SELF_CLOSING_TAG.test( string ) ||
		null !== string.replace( /%%/g, '' ).match( REGEXP_SPRINTF_PLACEHOLDER )
	);
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			missingPlaceholder:
				'Plural translatable strings should include a placeholder for the number, such as %d. If the strings do not show the number, choose between them with a `1 === count` check instead.',
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

				if ( strings.some( hasPlaceholder ) ) {
					return;
				}

				context.report( {
					node,
					messageId: 'missingPlaceholder',
				} );
			},
		};
	},
};
