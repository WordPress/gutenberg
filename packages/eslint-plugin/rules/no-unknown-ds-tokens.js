const tokenListModule = require( '@wordpress/theme/design-tokens.js' );
const tokenList = tokenListModule.default || tokenListModule;

const DS_TOKEN_PREFIX = 'wpds-';

/**
 * Single-pass extraction that finds all `--prefix-*` tokens in a CSS value
 * string and classifies each occurrence as `var()`-wrapped or bare.
 *
 * @param {string} value       - The CSS value string to search.
 * @param {string} [prefix=''] - Optional prefix to filter variables (e.g., 'wpds-').
 * @return {{ tokens: Set<string>, bare: Set<string> }}
 *   `tokens` — every unique matched token;
 *   `bare`   — the subset that appeared at least once without a `var()` wrapper.
 *
 * @example
 * classifyTokens(
 *   'var(--wpds-color-fg) --wpds-color-bg',
 *   'wpds-'
 * );
 * // → { tokens: Set {'--wpds-color-fg','--wpds-color-bg'},
 * //     bare:   Set {'--wpds-color-bg'} }
 */
function classifyTokens( value, prefix = '' ) {
	const regex = new RegExp(
		`(?:^|[^\\w])(var\\(\\s*)?(--${ prefix }[\\w-]+)`,
		'g'
	);
	const tokens = new Set();
	const bare = new Set();

	let match;
	while ( ( match = regex.exec( value ) ) !== null ) {
		const token = match[ 2 ];
		tokens.add( token );
		if ( ! match[ 1 ] ) {
			bare.add( token );
		}
	}

	return { tokens, bare };
}

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

					const { tokens, bare } = classifyTokens(
						value,
						DS_TOKEN_PREFIX
					);

					// Remove the trailing incomplete token — it's the one
					// being dynamically constructed by the next expression.
					if ( isFollowedByExpression ) {
						const endMatch = value.match( /(--([\w-]+))$/ );
						if ( endMatch ) {
							tokens.delete( endMatch[ 1 ] );
							bare.delete( endMatch[ 1 ] );
						}
					}

					for ( const token of tokens ) {
						if ( ! knownTokens.has( token ) ) {
							unknownTokens.push( token );
						} else if ( bare.has( token ) ) {
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
				let computedValue;

				if ( ! node.value ) {
					return;
				}

				if ( typeof node.value === 'string' ) {
					computedValue = node.value;
				} else if (
					typeof node.value === 'object' &&
					'raw' in node.value
				) {
					computedValue = node.value.cooked ?? node.value.raw;
				}

				if ( ! computedValue ) {
					return;
				}

				const { tokens: usedTokens, bare } = classifyTokens(
					computedValue,
					DS_TOKEN_PREFIX
				);
				const unknownTokens = [ ...usedTokens ].filter(
					( token ) => ! knownTokens.has( token )
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
					const bareTokens = [ ...usedTokens ].filter(
						( token ) =>
							knownTokens.has( token ) && bare.has( token )
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
