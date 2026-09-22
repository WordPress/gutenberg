import stylelint from 'stylelint';
import { parseCSSVariableReferences } from '../postcss-plugins/parse-css-variables.mjs';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin-wpds/no-token-fallback-values';

const messages = ruleMessages( ruleName, {
	rejected: ( tokenName ) =>
		`Do not add a fallback value for Design System token '${ tokenName }'. Fallbacks should be injected automatically at build time (see @wordpress/theme package README).`,
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
			// Include the property and raw comments so parser offsets match the
			// declaration's source positions, even when token text is repeated.
			const references = parseCSSVariableReferences(
				ruleNode.toString()
			).references;

			for ( const reference of references ) {
				if (
					! reference.name.startsWith( '--wpds-' ) ||
					! reference.fallbackSeparator
				) {
					continue;
				}

				report( {
					message: messages.rejected( reference.name ),
					node: ruleNode,
					index: reference.sourceIndex,
					endIndex:
						reference.fallbackSeparator.sourceEndIndex -
						reference.fallbackSeparator.after.length,
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
