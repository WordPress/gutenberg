/**
 * External dependencies
 */
const { isArray, map } = require( 'lodash' );
const babelPresetEnv = require( 'babel-preset-env' );

/**
 * WordPress dependencies
 */
const babelDefaultConfig = require( '@wordpress/babel-preset-default' );

const plugins = babelDefaultConfig.plugins;

if ( ! process.env.SKIP_JSX_PRAGMA_TRANSFORM ) {
	plugins.push( [ require( '@wordpress/babel-plugin-import-jsx-pragma' ).default, {
		scopeVariable: 'createElement',
		source: '@wordpress/element',
		isDefault: false,
	} ] );
}

const babelConfigs = {
	main: Object.assign(
		{},
		babelDefaultConfig,
		{
			babelrc: false,
			plugins,
			presets: map( babelDefaultConfig.presets, ( preset ) => {
				if ( isArray( preset ) && preset[ 0 ] === babelPresetEnv ) {
					return [ babelPresetEnv, Object.assign(
						{},
						preset[ 1 ],
						{ modules: 'commonjs' }
					) ];
				}
				return preset;
			} ),
		}
	),
	module: Object.assign(
		{},
		babelDefaultConfig,
		{
			babelrc: false,
			plugins,
		}
	),
};

function getBabelConfig( environment ) {
	return babelConfigs[ environment ];
}

module.exports = getBabelConfig;
