module.exports = function( api ) {
	let wpBuildOpts = {};
	const isTestEnv = api.env() === 'test';

	// Because we serve a different preset depending
	// on the caller options, we need to tell the cache
	// when it needs updating. Otherwise, it won't be
	// recalculated for different builds.
	api.cache.using( () => wpBuildOpts.name );

	api.caller( ( caller ) => {
		if ( caller && (
			caller.name === 'WP_BUILD_MAIN' ||
			caller.name === 'WP_BUILD_MODULE'
		) ) {
			wpBuildOpts = { ...caller };
		}
	} );

	const getPresetEnv = () => {
		const opts = {};

		if ( isTestEnv ) {
			opts.useBuiltIns = 'usage';
		} else {
			opts.modules = false;
			opts.targets = {
				browsers: require( 'extends @wordpress/browserslist-config' ),
			};
		}

		if (
			wpBuildOpts.name === 'WP_BUILD_MAIN' ||
			wpBuildOpts.name === 'WP_BUILD_MODULE'
		) {
			opts.modules = wpBuildOpts.modules;
		}

		return [ require.resolve( '@babel/preset-env' ), opts ];
	};

	const maybeGetPluginTransformRuntime = () => {
		if ( isTestEnv ) {
			return undefined;
		}

		const opts = {
			helpers: true,
			useESModules: false,
		};

		if ( wpBuildOpts.name === 'WP_BUILD_MODULE' ) {
			opts.useESModules = wpBuildOpts.useESModules;
		}

		return [ require.resolve( '@babel/plugin-transform-runtime' ), opts ];
	};

	return {
		presets: [ getPresetEnv() ],
		plugins: [
			require.resolve( '@babel/plugin-proposal-object-rest-spread' ),
			[
				require.resolve( '@wordpress/babel-plugin-import-jsx-pragma' ),
				{
					scopeVariable: 'createElement',
					source: '@wordpress/element',
					isDefault: false,
				},
			],
			[ require.resolve( '@babel/plugin-transform-react-jsx' ), {
				pragma: 'createElement',
			} ],
			require.resolve( '@babel/plugin-proposal-async-generator-functions' ),
			maybeGetPluginTransformRuntime(),
		].filter( Boolean ),
	};
};
