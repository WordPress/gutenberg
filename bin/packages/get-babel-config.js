/**
 * External dependencies
 */
const { get, map } = require( 'lodash' );
const babel = require( '@babel/core' );

/**
 * WordPress dependencies
 */
const { options: babelDefaultConfig } = babel.loadPartialConfig( {
	configFile: '@wordpress/babel-preset-default',
} );
const plugins = babelDefaultConfig.plugins;
if ( ! process.env.SKIP_JSX_PRAGMA_TRANSFORM ) {
	plugins.push( [ '@wordpress/babel-plugin-import-jsx-pragma', {
		scopeVariable: 'createElement',
		source: '@wordpress/element',
		isDefault: false,
	} ] );
}

const overrideOptions = ( target, targetName, options ) => {
	if ( get( target, [ 'file', 'request' ] ) === targetName ) {
		return [ targetName, Object.assign(
			{},
			target.options,
			options
		) ];
	}
	return target;
};

const babelConfigs = {
	main: Object.assign(
		{},
		babelDefaultConfig,
		{
			plugins: map(
				plugins,
				( plugin ) => overrideOptions( plugin, '@babel/plugin-transform-runtime', { corejs: false } )
			),
			presets: map(
				babelDefaultConfig.presets,
				( preset ) => overrideOptions( preset, '@babel/preset-env', { modules: 'commonjs' } )
			),
		}
	),
	module: Object.assign(
		{},
		babelDefaultConfig,
		{
			plugins: map(
				plugins,
				( plugin ) => overrideOptions( plugin, '@babel/plugin-transform-runtime', {
					corejs: false,
					useESModules: true,
				} )
			),
		}
	),
};

function getBabelConfig( environment ) {
	return babelConfigs[ environment ];
}

module.exports = getBabelConfig;
