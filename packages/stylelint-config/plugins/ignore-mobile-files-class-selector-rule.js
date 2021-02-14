/**
 * External dependencies
 */
const stylelint = require( 'stylelint' );

const { report, ruleMessages } = stylelint.utils;
const ruleName = 'wordpress/ignore-mobile-files-class-selector-rule';
const mobileScssExtensions = [ '.native.scss', '.android.scss', '.ios.scss' ];
const messages = ruleMessages( ruleName, {
	expected: ( extension ) =>
		`For *${ extension } files, the "selector-class-pattern" rule must be disabled. To disable it, add "/* stylelint-disable selector-class-pattern */" as the file's first line.`,
} );

const getMatchingExtension = ( fileName ) =>
	mobileScssExtensions.find( ( extension ) =>
		fileName.endsWith( extension )
	);

const isMobileScssFile = ( fileName ) => !! getMatchingExtension( fileName );

const isDisablingSelectorClassPattern = ( firstNode ) =>
	firstNode.type === 'comment' &&
	firstNode.text.trim() === 'stylelint-disable selector-class-pattern';

module.exports = stylelint.createPlugin(
	ruleName,
	function getPlugin( primaryOption, secondaryOptionObject, context ) {
		return function lint( postcssRoot, postcssResult ) {
			const isAutoFixing = Boolean( context.fix );
			const fileName = postcssRoot.source.input.from;

			if (
				isMobileScssFile( fileName ) &&
				! isDisablingSelectorClassPattern( postcssRoot.first )
			) {
				if ( ! isAutoFixing ) {
					report( {
						ruleName,
						result: postcssResult,
						message: messages.expected(
							getMatchingExtension( fileName )
						),
						node: postcssRoot.first,
					} );
				} else {
					postcssRoot.prepend(
						'/* stylelint-disable selector-class-pattern */'
					);
				}
			}
		};
	}
);

module.exports.ruleName = ruleName;
module.exports.messages = messages;
