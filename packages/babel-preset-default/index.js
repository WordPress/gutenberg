module.exports = function( api ) {
	const isTestEnv = api.env() === 'test';

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

		// console.log( 'editor build ', process.env.WP_EDITOR_BUILD );
		if ( process.env.WP_EDITOR_BUILD === 'main' ) {
			opts.modules = 'commonjs';
		} else if ( process.env.WP_EDITOR_BUILD === 'module' ) {
			opts.modules = false;
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

		if ( process.env.WP_EDITOR_BUILD === 'module' ) {
			opts.useESModules = true;
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
