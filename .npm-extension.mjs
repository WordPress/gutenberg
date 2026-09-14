/**
 * Root-owned repairs to third-party manifests, applied by npm before it
 * resolves the tree. Drop a repair once the linked upstream fix ships.
 *
 * @see https://docs.npmjs.com/cli/configuring-npm/npm-extension
 */

/**
 * Peer ranges that upstream has not widened yet, keyed by package name.
 * `major` limits each repair to the release line that needs it.
 */
const PEER_RANGES = {
	// https://github.com/storybookjs/storybook/issues/36082
	'@storybook/addon-vitest': {
		major: 10,
		peerDependencies: {
			'@vitest/browser': '^3.0.0 || ^4.0.0 || ^5.0.0',
			'@vitest/browser-playwright': '^4.0.0 || ^5.0.0',
			'@vitest/runner': '^3.0.0 || ^4.0.0 || ^5.0.0',
			vitest: '^3.0.0 || ^4.0.0 || ^5.0.0',
		},
	},
	// https://github.com/import-js/eslint-plugin-import/issues/3227
	'eslint-plugin-import': {
		major: 2,
		peerDependencies: {
			eslint: '^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9 || ^10',
		},
	},
	// Fixed in 62.0.0, but `@wordpress/eslint-plugin` still depends on ^50.
	'eslint-plugin-jsdoc': {
		major: 50,
		peerDependencies: {
			eslint: '^7.0.0 || ^8.0.0 || ^9.0.0 || ^10.0.0',
		},
	},
	// https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/1075
	'eslint-plugin-jsx-a11y': {
		major: 6,
		peerDependencies: {
			eslint: '^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9 || ^10',
		},
	},
	// https://github.com/jsx-eslint/eslint-plugin-react/issues/3977
	'eslint-plugin-react': {
		major: 7,
		peerDependencies: {
			eslint: '^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7 || ^10',
		},
	},
};

/**
 * Optional peers the package never loads here. A mismatched copy elsewhere
 * in the tree would otherwise fail the install under `strict-peer-deps`.
 */
const UNUSED_OPTIONAL_PEERS = {
	// Only referenced from JSDoc types; the tree has type-fest@0.6.0 at the root.
	'@pmmmwh/react-refresh-webpack-plugin': [ 'type-fest' ],
	// Only loaded for YAML PostCSS configs; the tree has yaml@1 at the root.
	vite: [ 'yaml' ],
};

const getMajor = ( version ) => Number( version.split( '.' )[ 0 ] );

export function transformManifest( pkg, context ) {
	const peerRanges = PEER_RANGES[ pkg.name ];
	if ( peerRanges && getMajor( pkg.version ) === peerRanges.major ) {
		pkg.peerDependencies = {
			...pkg.peerDependencies,
			...peerRanges.peerDependencies,
		};
		context.log( `widened peer ranges of ${ pkg.name }@${ pkg.version }` );
	}

	/*
	 * The plugin only needs `@terrazzo/parser`; the CLI is just one consumer.
	 * No upstream issue yet.
	 */
	if (
		pkg.name === '@terrazzo/plugin-css' &&
		getMajor( pkg.version ) === 2
	) {
		pkg.peerDependenciesMeta = {
			...pkg.peerDependenciesMeta,
			'@terrazzo/cli': { optional: true },
		};
		context.log( `made @terrazzo/cli optional for ${ pkg.name }` );
	}

	for ( const name of UNUSED_OPTIONAL_PEERS[ pkg.name ] ?? [] ) {
		if ( pkg.peerDependenciesMeta?.[ name ]?.optional ) {
			delete pkg.peerDependencies[ name ];
			delete pkg.peerDependenciesMeta[ name ];
			context.log( `dropped optional peer ${ name } of ${ pkg.name }` );
		}
	}

	return pkg;
}
