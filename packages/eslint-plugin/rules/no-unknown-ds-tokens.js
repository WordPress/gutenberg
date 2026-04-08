const tokenListModule = require( '@wordpress/theme/design-tokens.js' );
const tokenList = tokenListModule.default || tokenListModule;

const {
	DS_TOKEN_PREFIX,
	collectTokenOccurrences,
	getUniqueTokenNames,
	getStaticNodeValue,
} = require( '../utils/ds-token-utils' );

const knownTokens = new Set( tokenList );
const wpdsTokensRegex = new RegExp( `(?:^|[^\\w])--${ DS_TOKEN_PREFIX }`, 'i' );

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
				const unknownTokens = [];
				const bareTokens = [];

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

					let occurrences = collectTokenOccurrences(
						value,
						DS_TOKEN_PREFIX
					);

					if ( isFollowedByExpression ) {
						const endMatch = value.match( /(--([\w-]+))$/ );
						if ( endMatch ) {
							occurrences = occurrences.filter(
								( o ) => o.token !== endMatch[ 1 ]
							);
						}
					}

					for ( const { token, bare } of occurrences ) {
						if ( ! knownTokens.has( token ) ) {
							unknownTokens.push( token );
						} else if ( bare ) {
							bareTokens.push( token );
						}
					}
				}

				if ( hasDynamic ) {
					context.report( {
						node,
						messageId: 'dynamicToken',
					} );
				}

				if ( unknownTokens.length > 0 ) {
					context.report( {
						node,
						messageId: 'onlyKnownTokens',
						data: {
							tokenNames: unknownTokens
								.map( ( token ) => `'${ token }'` )
								.join( ', ' ),
						},
					} );
				}

				if ( bareTokens.length > 0 ) {
					context.report( {
						node,
						messageId: 'bareToken',
						data: {
							tokenNames: bareTokens
								.map( ( token ) => `'${ token }'` )
								.join( ', ' ),
						},
					} );
				}
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
				const unknownTokens = getUniqueTokenNames(
					occurrences.filter(
						( occurrence ) => ! knownTokens.has( occurrence.token )
					)
				);

				if ( unknownTokens.length > 0 ) {
					context.report( {
						node,
						messageId: 'onlyKnownTokens',
						data: {
							tokenNames: unknownTokens
								.map( ( token ) => `'${ token }'` )
								.join( ', ' ),
						},
					} );
				}

				// Skip bare-token check for property keys
				// (e.g. `{ '--wpds-token': value }` declaring a custom property).
				const isPropertyKey =
					node.parent?.type === 'Property' &&
					node.parent.key === node;

				if ( ! isPropertyKey ) {
					const bareTokens = getUniqueTokenNames(
						occurrences.filter(
							( occurrence ) =>
								! occurrence.declaration &&
								occurrence.bare &&
								knownTokens.has( occurrence.token )
						)
					);

					if ( bareTokens.length > 0 ) {
						context.report( {
							node,
							messageId: 'bareToken',
							data: {
								tokenNames: bareTokens
									.map( ( token ) => `'${ token }'` )
									.join( ', ' ),
							},
						} );
					}
				}
			},
		};
	},
} );
