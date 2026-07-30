import stylelint from 'stylelint';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin-wpds/no-global-css-defense-custom-properties';

const GLOBAL_CSS_DEFENSE_PREFIX = '--_gcd-';

/**
 * Matches `--_gcd-*` custom properties referenced in declaration values
 * (e.g. inside `var(--_gcd-heading-font-weight)`). These are the internal
 * global CSS defense bridge used by `@wordpress/ui`.
 */
const globalCssDefenseTokenInValueRegex = /--_gcd-[\w-]*/g;

const messages = ruleMessages( ruleName, {
	rejectedUsage: ( tokenName ) =>
		`Do not use '${ tokenName }'. Use Design System tokens (\`--wpds-*\`) instead. \`--_gcd-*\` variables are an internal @wordpress/ui global CSS defense implementation detail.`,
	rejectedSetting: ( tokenName ) =>
		`Do not set '${ tokenName }'. Customize theme values via ThemeProvider instead. \`--_gcd-*\` variables are an internal @wordpress/ui global CSS defense implementation detail.`,
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

		root.walkDecls( ( decl ) => {
			const { prop, value } = decl;

			if ( prop.startsWith( GLOBAL_CSS_DEFENSE_PREFIX ) ) {
				report( {
					message: messages.rejectedSetting( prop ),
					node: decl,
					result,
					ruleName,
				} );
				return;
			}

			let match;
			globalCssDefenseTokenInValueRegex.lastIndex = 0;
			while (
				( match = globalCssDefenseTokenInValueRegex.exec( value ) ) !==
				null
			) {
				report( {
					message: messages.rejectedUsage( match[ 0 ] ),
					node: decl,
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
