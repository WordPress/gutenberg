const tokenListModule = require( '@wordpress/theme/design-tokens.js' );
const tokenList = tokenListModule.default || tokenListModule;

const DS_TOKEN_PREFIX = 'wpds-';

/**
 * Extracts all unique CSS custom properties (variables) from a given CSS value string,
 * including those in fallback positions, optionally filtering by a specific prefix.
 *
 * @param {string} value       - The CSS value string to search for variables.
 * @param {string} [prefix=''] - Optional prefix to filter variables (e.g., 'wpds-').
 * @return {Set<string>} A Set of unique matched CSS variable names (e.g., Set { '--wpds-token' }).
 *
 * @example
 * extractCSSVariables(
 *   'border: 1px solid var(--wpds-border-color, var(--wpds-border-fallback)); ' +
 *   'color: var(--wpds-color-fg, black); ' +
 *   'background: var(--unrelated-bg);',
 *   'wpds'
 * );
 * // → Set { '--wpds-border-color', '--wpds-border-fallback', '--wpds-color-fg' }
 */
function extractCSSVariables( value, prefix = '' ) {
	const regex = /--[\w-]+/g;
	const variables = new Set();

	let match;
	while ( ( match = regex.exec( value ) ) !== null ) {
		const variableName = match[ 0 ];
		if ( variableName.startsWith( `--${ prefix }` ) ) {
			variables.add( variableName );
		}
	}

	return variables;
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

					const tokens = extractCSSVariables(
						value,
						DS_TOKEN_PREFIX
					);

					// Remove the trailing incomplete token — it's the one
					// being dynamically constructed by the next expression.
					if ( isFollowedByExpression ) {
						const endMatch = value.match( /(--([\w-]+))$/ );
						if ( endMatch ) {
							tokens.delete( endMatch[ 1 ] );
						}
					}

					for ( const token of tokens ) {
						if ( ! knownTokens.has( token ) ) {
							unknownTokens.push( token );
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

				const usedTokens = extractCSSVariables(
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
			},
		};
	},
} );
