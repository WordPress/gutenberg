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

function makeFixerFunction( arg ) {
	return ( fixer ) => {
		switch ( arg.type ) {
			case 'TemplateLiteral':
				return arg.quasis.reduce( ( fixes, quasi ) => {
					if (
						'TemplateElement' === quasi.type &&
						quasi.value.value.match( /^\s|\s$/ )
					) {
						fixes.push(
							fixer.replaceTextRange(
								[ quasi.start, quasi.end ],
								`'${ quasi.value.value.trim() }'`
							)
						);
					}
					return fixes;
				}, [] );
			case 'Literal':
				return [ fixer.replaceText( arg, `'${ arg.value.trim() }'` ) ];

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
			noFlankingWhitespace:
				'Translations should not contain flanking whitespace{{problem}}',
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
						messageId: 'noFlankingWhitespace',
						data: {
							problem: problemString,
						},
						fix: makeFixerFunction( arg ),
					} );
				}
			},
		};
	},
};
