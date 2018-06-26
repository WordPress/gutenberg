/**
 * External dependencies
 */
const { isArray, map } = require( 'lodash' );
const babelPluginTransformReactJSX = require( 'babel-plugin-transform-react-jsx' );
const babelPresetEnv = require( 'babel-preset-env' );

/**
 * WordPress dependencies
 */
const babelDefaultConfig = require( '@wordpress/babel-preset-default' );

const plugins = map( babelDefaultConfig.plugins, ( plugin ) => {
	if ( isArray( plugin ) && plugin[ 0 ] === babelPluginTransformReactJSX ) {
		// TODO: It should become the default value when all modules are moved to packages.
		return [ babelPluginTransformReactJSX, { pragma: 'createElement' } ];
	}

	return plugin;
} );

if ( process.env.TRANSFORM_JSX_PRAGMA ) {
	plugins.push( [ require( '../../packages/babel-plugin-import-jsx-pragma' ).default, {
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
