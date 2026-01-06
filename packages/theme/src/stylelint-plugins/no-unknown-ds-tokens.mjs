import stylelint from 'stylelint';
import tokenList from '../prebuilt/js/design-tokens.mjs';

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
	/** @type {Set<string>} */
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
const wpdsTokensRegex = new RegExp( `[^\\w]--${ DS_TOKEN_PREFIX }`, 'i' );

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin-wpds/no-unknown-ds-tokens';

const messages = ruleMessages( ruleName, {
	rejected: ( tokenNames ) =>
		`The following CSS variables are not valid Design System tokens: ${ tokenNames }`,
} );

/** @type {import('stylelint').Rule} */
const ruleFunction = ( primary ) => {
	return ( root, result ) => {
		const validOptions = validateOptions( result, ruleName, {
			actual: primary,
			possible: [ true ],
		} );

		if ( ! validOptions ) {
			return;
		}

		root.walkDecls( ( ruleNode ) => {
			const { value } = ruleNode;
			// Early match for WPDS tokens to avoid unnecessary processing.
			if ( wpdsTokensRegex.test( value ) ) {
				const usedTokens = extractCSSVariables(
					value,
					DS_TOKEN_PREFIX
				);
				const unknownTokens = new Set(
					[ ...usedTokens ].filter(
						( token ) => ! knownTokens.has( token )
					)
				);

				if ( unknownTokens.size > 0 ) {
					report( {
						message: messages.rejected(
							Array.from( unknownTokens )
								.map( ( token ) => `'${ token }'` )
								.join( ', ' )
						),
						node: ruleNode,
						result,
						ruleName,
					} );
				}
			}
		} );
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

/** @type {import('stylelint').Plugin} */
export default createPlugin( ruleName, ruleFunction );
