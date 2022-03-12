/**
 * Internal dependencies
 */
const { hasBabelConfig } = require( '../utils' );

const eslintConfig = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	settings: {
		'import/resolver': 'webpack',
	},
};

if ( ! hasBabelConfig() ) {
	eslintConfig.parserOptions = {
		requireConfigFile: false,
		babelOptions: {
			presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
		},
	};
}

module.exports = eslintConfig;
