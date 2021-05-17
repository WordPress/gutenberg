module.exports = ( api, opts = { ignoreBrowserslistConfig: true } ) => {
	let wpBuildOpts = {};
	const isWPBuild = ( name ) =>
		[ 'WP_BUILD_MAIN', 'WP_BUILD_MODULE' ].some(
			( buildName ) => name === buildName
		);

	const isTestEnv = api.env() === 'test';

	api.caller( ( caller ) => {
		if ( caller && isWPBuild( caller.name ) ) {
			wpBuildOpts = { ...caller };
			return caller.name;
		}
		return undefined;
	} );

	const getPresetEnv = () => {
		const presetEnvOpts = {
			include: [ 'proposal-nullish-coalescing-operator' ],
		};

		if ( isTestEnv ) {
			presetEnvOpts.targets = {
				node: 'current',
			};
		} else {
			presetEnvOpts.modules = false;
			// Set up target only if Babel should not search for the project's browserslist config.
			if ( false !== opts.ignoreBrowserslistConfig ) {
				presetEnvOpts.targets = {
					browsers: require( '@wordpress/browserslist-config' ),
				};
			}
		}

		if ( isWPBuild( wpBuildOpts.name ) ) {
			presetEnvOpts.modules = wpBuildOpts.modules;
		}

		return [ require.resolve( '@babel/preset-env' ), presetEnvOpts ];
	};

	const maybeGetPluginTransformRuntime = () => {
		if ( isTestEnv ) {
			return undefined;
		}

		const pluginTransformRuntimeOpts = {
			helpers: true,
			useESModules: false,
		};

		if ( wpBuildOpts.name === 'WP_BUILD_MODULE' ) {
			pluginTransformRuntimeOpts.useESModules = wpBuildOpts.useESModules;
		}

		return [
			require.resolve( '@babel/plugin-transform-runtime' ),
			pluginTransformRuntimeOpts,
		];
	};

	return {
		presets: [
			getPresetEnv(),
			require.resolve( '@babel/preset-typescript' ),
		],
		plugins: [
			require.resolve( '@wordpress/warning/babel-plugin' ),
			[
				require.resolve( '@wordpress/babel-plugin-import-jsx-pragma' ),
				{
					scopeVariable: 'createElement',
					scopeVariableFrag: 'Fragment',
					source: '@wordpress/element',
					isDefault: false,
				},
			],
			[
				require.resolve( '@babel/plugin-transform-react-jsx' ),
				{
					pragma: 'createElement',
					pragmaFrag: 'Fragment',
				},
			],
			maybeGetPluginTransformRuntime(),
		].filter( Boolean ),
	};
};
