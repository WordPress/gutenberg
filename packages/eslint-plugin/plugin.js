/**
 * Internal dependencies
 */
const { name, version } = require( './package.json' );

module.exports = {
	meta: {
		name,
		version,
	},
	configs: {},
	rules: require( './rules' ),
};
