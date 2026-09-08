const esbuild = require( 'esbuild' );

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
		build.onResolve( { filter: /^@wordpress\/ui(\/|$)/ }, ( args ) => {
			// Don't bundle `@wordpress/ui`: it is not a WordPress script, so
			// consumers bundle it themselves. Leaving it external keeps a
			// single copy of the package (and of `@wordpress/theme`, which it
			// imports) in the consumer bundle, and keeps its third-party
			// dependencies out of this package's dependency list.
			return { path: args.path, external: true };
		} );
		build.onResolve( { filter: /^@wordpress\// }, () => {
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
