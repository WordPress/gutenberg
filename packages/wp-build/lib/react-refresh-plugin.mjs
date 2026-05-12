/**
 * esbuild plugin that applies react-refresh/babel transform to source files
 * during IIFE bundling. This enables React Fast Refresh (hot module replacement)
 * for development mode.
 *
 * The plugin registers per-file $RefreshReg$ and $RefreshSig$ bindings that
 * connect to window.__hmr_runtime (the react-refresh runtime).
 *
 * Designed to be a no-op if @babel/core or react-refresh are not installed,
 * so wp-build remains usable by other projects.
 */

/**
 * Create the react-refresh esbuild plugin.
 *
 * @param {string} moduleIdBaseDir Absolute path used as the base when
 *                                 computing stable module IDs (per-file
 *                                 paths relative to this dir become the
 *                                 family key passed to register()).
 *                                 Typically the workspace `packages/` dir,
 *                                 so two bundles that include the same
 *                                 source file end up with the same family
 *                                 ID and fast-refresh swaps fibers across
 *                                 bundles correctly.
 * @return {Object} esbuild plugin.
 */
export function reactRefreshPlugin( moduleIdBaseDir ) {
	let babel;
	let available = null; // null = not checked, true/false after check
	let createHash;

	// transpilePackage rewrites every build-module/*.mjs on each rebuild
	// (new mtimes), so esbuild's incremental cache treats them all as
	// changed and re-calls onLoad on all 2300+ files. Cache transform
	// output here keyed by content hash — same content → skip babel.
	const transformCache = new Map(); // path -> { hash, result }

	// Per-rebuild stats, logged from onEnd. Surfaces a quick heartbeat
	// (`[react-refresh] N transformed (Xms), M cached`) so contributors
	// can confirm HMR is wired up and incremental rebuilds are hitting
	// the cache, without having to dig into esbuild internals.
	let perfFileCount = 0;
	let perfCacheHits = 0;
	let perfTotalMs = 0;

	return {
		name: 'react-refresh',
		setup( build ) {
			build.onStart( () => {
				perfFileCount = 0;
				perfCacheHits = 0;
				perfTotalMs = 0;
			} );
			build.onEnd( () => {
				if ( perfFileCount > 0 || perfCacheHits > 0 ) {
					console.log(
						`  [react-refresh] ${ perfFileCount } transformed (${ Math.round(
							perfTotalMs
						) }ms), ${ perfCacheHits } cached`
					);
				}
			} );

			// Only process files in the default namespace (skip external namespaces).
			build.onLoad(
				{ filter: /\.([cm]?js|jsx|tsx?)$/, namespace: '' },
				async ( args ) => {
					// Lazy-check dependencies on first call.
					if ( available === null ) {
						try {
							/* eslint-disable import/no-extraneous-dependencies -- transitive deps used only by this HMR plugin. */
							babel = ( await import( '@babel/core' ) ).default;
							// Verify react-refresh/babel is importable.
							await import( 'react-refresh/babel' );
							/* eslint-enable import/no-extraneous-dependencies */
							available = true;
						} catch {
							available = false;
						}
					}

					if ( ! available ) {
						return null; // Let esbuild handle normally.
					}

					if ( ! createHash ) {
						createHash = ( await import( 'node:crypto' ) )
							.createHash;
					}
					const { readFile } = await import( 'fs/promises' );
					const { relative } = await import( 'path' );

					const code = await readFile( args.path, 'utf8' );

					// Content-hash cache: skip babel if file content matches
					// the previously-transformed version of this file, even
					// if mtime changed (transpilePackage re-emits every file).
					const hash = createHash( 'sha1' )
						.update( code )
						.digest( 'hex' );
					const cached = transformCache.get( args.path );
					if ( cached && cached.hash === hash ) {
						perfCacheHits++;
						return cached.result;
					}

					// Past the cache check — we're going to do real work.
					// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- intentionally measured around the babel transform, even on the rare null-result early return below.
					const _perfStart = performance.now();

					// Compute a stable module ID from the file path relative to packages/.
					// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- moduleId is used after the babel transform check below, but moving it down would push it past intervening early returns.
					const moduleId = relative( moduleIdBaseDir, args.path )
						.replace( /\\/g, '/' )
						.replace( /\.([cm]?js|jsx|tsx?)$/, '' );

					const isTsx = /\.tsx$/.test( args.path );
					const isTs = /\.ts$/.test( args.path );

					const presets = [];
					const plugins = [
						[ 'react-refresh/babel', { skipEnvCheck: true } ],
					];

					if ( isTs || isTsx ) {
						// preset-typescript both parses TS syntax and strips types,
						// so esbuild only has to handle JS (+ JSX for .tsx).
						presets.push( [
							'@babel/preset-typescript',
							{ isTSX: isTsx, allExtensions: isTsx },
						] );
					} else {
						// .js / .jsx: enable JSX parsing only (esbuild transforms it).
						plugins.push( '@babel/plugin-syntax-jsx' );
					}

					const result = babel.transformSync( code, {
						filename: args.path,
						ast: false,
						sourceMaps: 'inline',
						presets,
						plugins,
						// Don't load any config files - only use the plugin above.
						configFile: false,
						babelrc: false,
					} );

					if ( ! result || ! result.code ) {
						return null;
					}

					// Prepend per-file $RefreshReg$ / $RefreshSig$ bindings.
					const moduleIdStr = JSON.stringify( moduleId );
					const preamble =
						`var $RefreshSig$ = window.__hmr_runtime` +
						` ? window.__hmr_runtime.createSignatureFunctionForTransform` +
						` : function() { return function(t) { return t; }; };\n` +
						`var $RefreshReg$ = window.__hmr_runtime` +
						` ? function(type, id) { window.__hmr_runtime.register(type, ${ moduleIdStr } + " " + id); }` +
						` : function() {};\n`;

					perfFileCount++;
					perfTotalMs += performance.now() - _perfStart;

					// Loader: .ts has no JSX (types stripped by preset) → 'js'.
					// Everything else may contain JSX → 'jsx'.
					const transformResult = {
						contents: preamble + result.code,
						loader: isTs ? 'js' : 'jsx',
					};
					transformCache.set( args.path, {
						hash,
						result: transformResult,
					} );
					return transformResult;
				}
			);
		},
	};
}
