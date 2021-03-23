/**
 * External dependencies
 */
const { createPlugin, rules, utils } = require( 'stylelint' );

const baseRule = rules[ 'selector-class-pattern' ];
const ruleName = '@wordpress/selector-class-pattern-web-only';
const messages = utils.ruleMessages( ruleName, {
	expected: ( selector ) =>
		`${ selector } selector should use lowercase and separate words with hyphens (${ ruleName })`,
} );

module.exports = createPlugin(
	ruleName,
	( ...ruleSettings ) => ( root, result ) => {
		const isNativeStylesheet = /.*\.(android|ios|native)\.scss$/.test(
			root.source.input.from
		);

		if ( ! isNativeStylesheet ) {
			utils.checkAgainstRule(
				{
					ruleName: baseRule.ruleName,
					ruleSettings,
					root,
				},
				( warning ) => {
					utils.report( {
						message: messages.expected( warning.node.selector ),
						ruleName,
						result,
						node: warning.node,
						line: warning.line,
						column: warning.column,
					} );
				}
			);
		}
	}
);

module.exports.ruleName = ruleName;
module.exports.messages = messages;
