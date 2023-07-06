/**
 * External dependencies
 */
const browserslist = require( 'browserslist' );

module.exports = ( api ) => {
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
		const opts = {
			bugfixes: true,
			include: [
				'proposal-nullish-coalescing-operator',
				'proposal-logical-assignment-operators',
			],
		};

		if ( isTestEnv ) {
			opts.targets = {
				node: 'current',
			};
		} else {
			opts.modules = false;
			const localBrowserslistConfig =
				browserslist.findConfig( '.' ) || {};
			opts.targets = {
				browsers:
					localBrowserslistConfig.defaults ||
					require( '@wordpress/browserslist-config' ),
			};
		}

		if ( isWPBuild( wpBuildOpts.name ) ) {
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
					useSpread: true,
				},
			],
			maybeGetPluginTransformRuntime(),
		].filter( Boolean ),
	};
};
