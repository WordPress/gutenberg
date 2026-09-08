const fs = require( 'fs' );
const path = require( 'path' );
const esbuild = require( 'esbuild' );

/**
 * Whether WordPress ships the package as a script or a script module. Those
 * packages are bundled: consumers reach them through the platform. The
 * remaining `@wordpress/*` packages are never provided by WordPress, so
 * consumers bundle them themselves, as `@wordpress/build` and
 * `@wordpress/scripts` do. Mirrors the package.json flags that
 * `@wordpress/build` reads to tell the two apart.
 *
 * @param {string} name Package name without the `@wordpress/` scope.
 * @return {boolean} Whether the package is a WordPress script or script module.
 */
function isWordPressScript( name ) {
	const packageJson = JSON.parse(
		fs.readFileSync(
			path.join( __dirname, '..', name, 'package.json' ),
			'utf8'
		)
	);
	return !! ( packageJson.wpScript || packageJson.wpScriptModuleExports );
}

const wpExternals = {
	name: 'wordpress-externals',
	setup( build ) {
		build.onResolve(
			{ filter: /^@wordpress\/(data|hooks|i18n|date)(\/|$)/ },
			( args ) => {
				// Don't bundle WordPress singleton packages. Keep the list in
				// sync with `SINGLETONS` in
				// `tools/validation/check-private-apis.mjs`.
				return { path: args.path, external: true };
			}
		);
		build.onResolve( { filter: /^@wordpress\// }, ( args ) => {
			const name = args.path.split( '/' )[ 1 ];
			if ( ! isWordPressScript( name ) ) {
				// Don't bundle the packages WordPress does not ship, such as
				// `@wordpress/ui`: consumers bundle them themselves, so leaving
				// them external keeps a single copy of each in the consumer
				// bundle and keeps their third-party dependencies out of this
				// package's dependency list. The consumer's copy of
				// `@wordpress/ui` resolves `@wordpress/theme` to the `wp.theme`
				// script, so the bundle requires WordPress 7.0 or later.
				return { path: args.path, external: true };
			}
			// Bundle WordPress packages
			return { external: false };
		} );
		build.onResolve( { filter: /^\.[\.\/]/ }, () => {
			// Bundle relative paths
			return { external: false };
		} );
		build.onResolve( { filter: /.+/ }, ( args ) => {
			// Mark everything else as external
			return { path: args.path, external: true };
		} );
	},
};

esbuild.build( {
	entryPoints: [ 'src/index.ts' ],
	bundle: true,
	outdir: 'build-wp',
	plugins: [ wpExternals ],
	jsx: 'automatic',
	logLevel: 'info',
	format: 'esm',
} );
