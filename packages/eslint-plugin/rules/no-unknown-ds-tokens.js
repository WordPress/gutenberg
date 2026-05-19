const tokenListModule = require( '@wordpress/theme/design-tokens.js' );
const tokenList = tokenListModule.default || tokenListModule;

const {
	DS_TOKEN_PREFIX,
	collectTokenOccurrences,
	getStaticNodeValue,
	wpdsTokensRegex,
} = require( '../utils/ds-token-utils' );

const knownTokens = new Set( tokenList );

/**
 * @param {Array<{ token: string, bare: boolean, declaration: boolean }>} occurrences
 * @param {{ includeBareTokens?: boolean }}                               [options]
 */
function getInvalidTokenNames(
	occurrences,
	{ includeBareTokens = true } = {}
) {
	const unknownTokens = new Set();
	const bareTokens = new Set();

	for ( const { token, bare, declaration } of occurrences ) {
		if ( ! knownTokens.has( token ) ) {
			unknownTokens.add( token );
			continue;
		}

		if ( includeBareTokens && bare && ! declaration ) {
			bareTokens.add( token );
		}
	}

	return {
		unknownTokens: [ ...unknownTokens ],
		bareTokens: [ ...bareTokens ],
	};
}

/**
 * @param {string[]} tokenNames
 */
function formatTokenNames( tokenNames ) {
	return tokenNames.map( ( token ) => `'${ token }'` ).join( ', ' );
}

/**
 * @param {import('eslint').Rule.RuleContext} context
 * @param {import('estree').Node}             node
 * @param {'onlyKnownTokens' | 'bareToken'}   messageId
 * @param {string[]}                          tokenNames
 */
function reportTokenNames( context, node, messageId, tokenNames ) {
	if ( tokenNames.length === 0 ) {
		return;
	}

	context.report( {
		node,
		messageId,
		data: {
			tokenNames: formatTokenNames( tokenNames ),
		},
	} );
}

module.exports = /** @type {import('eslint').Rule.RuleModule} */ ( {
	meta: {
		type: 'problem',
		docs: {
			description: 'Prevent use of non-existing --wpds-* variables',
		},
		schema: [],
		messages: {
			onlyKnownTokens:
				'The following CSS variables are not valid Design System tokens: {{ tokenNames }}',
			dynamicToken:
				'Design System tokens must not be dynamically constructed, as they cannot be statically verified for correctness or processed automatically to inject fallbacks.',
			bareToken:
				'Design System tokens must be wrapped in `var()` for build-time fallback injection to work: {{ tokenNames }}',
		},
	},
	create( context ) {
		const dynamicTemplateLiteralAST = `TemplateLiteral[expressions.length>0]:has(TemplateElement[value.raw=${ wpdsTokensRegex }])`;
		const staticTokensAST = `:matches(Literal[value=${ wpdsTokensRegex }], TemplateLiteral[expressions.length=0] TemplateElement[value.raw=${ wpdsTokensRegex }])`;
		const dynamicTokenEndRegex = new RegExp(
			`--${ DS_TOKEN_PREFIX }[\\w-]*$`
		);

		return {
			/**
			 * For template literals with expressions, check each quasi
			 * individually: flag as dynamic only when a `--wpds-*` token
			 * name is split across a quasi/expression boundary, and
			 * validate any complete static tokens normally.
			 *
			 * @param {import('estree').TemplateLiteral} node
			 */
			[ dynamicTemplateLiteralAST ]( node ) {
				let hasDynamic = false;
				const occurrences = [];

				for ( const quasi of node.quasis ) {
					const raw = quasi.value.raw;
					const value = quasi.value.cooked ?? raw;
					const isFollowedByExpression = ! quasi.tail;

					if (
						isFollowedByExpression &&
						dynamicTokenEndRegex.test( raw )
					) {
						hasDynamic = true;
					}

					let quasiOccurrences = collectTokenOccurrences(
						value,
						DS_TOKEN_PREFIX
					);

					if ( isFollowedByExpression ) {
						const endMatch = value.match( /(--([\w-]+))$/ );
						if ( endMatch ) {
							quasiOccurrences = quasiOccurrences.filter(
								( { token } ) => token !== endMatch[ 1 ]
							);
						}
					}

					occurrences.push( ...quasiOccurrences );
				}

				const { unknownTokens, bareTokens } =
					getInvalidTokenNames( occurrences );

				if ( hasDynamic ) {
					context.report( {
						node,
						messageId: 'dynamicToken',
					} );
				}

				reportTokenNames(
					context,
					node,
					'onlyKnownTokens',
					unknownTokens
				);
				reportTokenNames( context, node, 'bareToken', bareTokens );
			},
			/** @param {import('estree').Literal | import('estree').TemplateElement} node */
			[ staticTokensAST ]( node ) {
				const computedValue = getStaticNodeValue( node );

				if ( ! computedValue ) {
					return;
				}

				const occurrences = collectTokenOccurrences(
					computedValue,
					DS_TOKEN_PREFIX
				);
				// Skip bare-token check for property keys
				// (e.g. `{ '--wpds-token': value }` declaring a custom property).
				const isPropertyKey =
					node.parent?.type === 'Property' &&
					node.parent.key === node;
				const { unknownTokens, bareTokens } = getInvalidTokenNames(
					occurrences,
					{
						includeBareTokens: ! isPropertyKey,
					}
				);

				reportTokenNames(
					context,
					node,
					'onlyKnownTokens',
					unknownTokens
				);
				reportTokenNames( context, node, 'bareToken', bareTokens );
			},
		};
	},
} );
