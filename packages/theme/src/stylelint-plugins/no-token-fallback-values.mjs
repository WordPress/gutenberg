import stylelint from 'stylelint';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin-wpds/no-token-fallback-values';

/**
 * Matches `var(--wpds-<name>,` — the comma signals a fallback value.
 * Captures the token name (e.g. `--wpds-color-fg-content-neutral`).
 */
const varWithFallbackRegex = /var\(\s*(--wpds-[\w-]+)\s*,/g;

const messages = ruleMessages( ruleName, {
	rejected: ( tokenName ) =>
		`Do not add a fallback value for Design System token '${ tokenName }'. Fallbacks are injected automatically at build time.`,
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

			let match;
			varWithFallbackRegex.lastIndex = 0;
			while ( ( match = varWithFallbackRegex.exec( value ) ) !== null ) {
				report( {
					message: messages.rejected( match[ 1 ] ),
					node: ruleNode,
					word: match[ 0 ],
					result,
					ruleName,
				} );
			}
		} );
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

/** @type {import('stylelint').Plugin} */
export default createPlugin( ruleName, ruleFunction );
