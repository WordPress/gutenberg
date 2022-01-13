/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	getTextContentFromNode,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );

const HYPHEN = '-';
const EN_DASH = '–';

function replaceHypenWithEnDash( string ) {
	return string.replace( /-/g, EN_DASH );
}

// see eslint-plugin-wpcalypso.
function makeFixerFunction( arg ) {
	return ( fixer ) => {
		switch ( arg.type ) {
			case 'TemplateLiteral':
				return arg.quasis.reduce( ( fixes, quasi ) => {
					if (
						'TemplateElement' === quasi.type &&
						quasi.value.raw.includes( HYPHEN )
					) {
						fixes.push(
							fixer.replaceTextRange(
								[ quasi.start, quasi.end ],
								replaceHypenWithEnDash( quasi.value.raw )
							)
						);
					}
					return fixes;
				}, [] );

			case 'Literal':
				return [
					fixer.replaceText( arg, replaceHypenWithEnDash( arg.raw ) ),
				];

			case 'BinaryExpression':
				return [
					...makeFixerFunction( arg.left )( fixer ),
					...makeFixerFunction( arg.right )( fixer ),
				];
		}
	};
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			foundHyphen: 'Use dashes (en or em) in place of hypens',
		},
		fixable: 'code',
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
					if (
						! argumentString ||
						! argumentString.includes( HYPHEN )
					) {
						continue;
					}

					context.report( {
						node,
						messageId: 'foundHyphen',
						fix: makeFixerFunction( arg ),
					} );
				}
			},
		};
	},
};
