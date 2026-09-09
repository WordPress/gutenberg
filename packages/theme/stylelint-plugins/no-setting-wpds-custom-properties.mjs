import stylelint from 'stylelint';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin-wpds/no-setting-wpds-custom-properties';

const messages = ruleMessages( ruleName, {
	rejected: () =>
		`Do not set CSS custom properties using the Design System tokens namespace (i.e. beginning with --wpds-*).`,
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
			const { prop } = ruleNode;
			if ( prop.startsWith( '--wpds-' ) ) {
				report( {
					message: messages.rejected(),
					node: ruleNode,
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
