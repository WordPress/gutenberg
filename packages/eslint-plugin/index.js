const plugin = {
	meta: {
		name: '@wordpress/eslint-plugin',
		version: require( './package.json' ).version,
	},
	rules: require( './rules' ),
	configs: {},
};

const configs = require( './configs' );
Object.assign( plugin.configs, configs );

module.exports = plugin;
