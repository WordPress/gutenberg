/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	getTextContentFromNode,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );

const EN_DASH = '–';
const HYPHEN_IN_RANGE = /(\d\s*)-(\s*\d)/g;

function replaceHypenWithEnDash( string ) {
	return string.replace( HYPHEN_IN_RANGE, `$1${ EN_DASH }$2` );
}

// see eslint-plugin-wpcalypso.
function makeFixerFunction( arg ) {
	return ( fixer ) => {
		switch ( arg.type ) {
			case 'TemplateLiteral':
				return arg.quasis.reduce( ( fixes, quasi ) => {
					if (
						'TemplateElement' === quasi.type &&
						quasi.value.raw.match( HYPHEN_IN_RANGE )
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
			foundHyphen:
				'Use dashes (en or em) in place of hypens for numeric ranges.',
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
						! argumentString.match( HYPHEN_IN_RANGE )
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
