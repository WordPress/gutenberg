/**
 * Deduplicate plugin references across config objects so that consumers
 * can spread configs (e.g. `...wordpress.configs.recommended`) without
 * hitting ESLint's "Cannot redefine plugin" error.
 *
 * When the same plugin namespace appears in multiple config objects,
 * this ensures all references point to the same object instance.
 *
 * @param {Array} configs Array of flat config objects.
 * @return {Array} The same array, mutated so duplicate plugin keys
 *                 share a single reference.
 */
function dedupePlugins( configs ) {
	const seen = Object.create( null );
	for ( const config of configs ) {
		if ( ! config.plugins ) {
			continue;
		}
		for ( const name of Object.keys( config.plugins ) ) {
			if ( name in seen ) {
				config.plugins[ name ] = seen[ name ];
			} else {
				seen[ name ] = config.plugins[ name ];
			}
		}
	}
	return configs;
}

const plugin = {
	meta: {
		name: '@wordpress/eslint-plugin',
		version: require( './package.json' ).version,
	},
	rules: require( './rules' ),
	configs: {},
};

const configs = require( './configs' );
// Deduplicate plugin references in each exported config array so
// consumers can spread them directly without "Cannot redefine plugin".
for ( const [ key, value ] of Object.entries( configs ) ) {
	plugin.configs[ key ] = Array.isArray( value )
		? dedupePlugins( value )
		: value;
}

module.exports = plugin;
