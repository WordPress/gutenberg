/**
 * Checks that a bundled package never pulls `@wordpress/private-apis` into its
 * module graph, including transitively (e.g. by importing a component from
 * `@wordpress/components` whose implementation uses private APIs internally).
 *
 * It bundles the package from `src/index` with esbuild, resolving all
 * `@wordpress/*` imports to their `src/` (so it checks current source, not
 * build output), then fails if any file from `packages/private-apis/` ends up
 * in the graph. Tree shaking keeps this precise: only code that is actually
 * used is followed.
 *
 * Singleton packages (data, hooks, i18n, date) stay external, mirroring the
 * dataviews `/wp` bundle: they are shared with the platform and never inlined
 * into a consumer bundle.
 *
 * Known, temporary violations live in `check-private-apis.config.json`, each
 * keyed on the module the pull passes through. A failing package is rebuilt
 * with its excepted modules externalized and passes only if that removes
 * private-apis from the graph entirely, so an exception never hides a new
 * route. An entry the package no longer needs fails the run as stale, so the
 * list can only shrink.
 *
 * Usage:
 *   node tools/validation/check-private-apis.mjs                     # every bundled package
 *   node tools/validation/check-private-apis.mjs [package-name ...]  # specific packages
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import esbuild from 'esbuild';

const ROOT = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);
const PACKAGES_DIR = path.join( ROOT, 'packages' );
// The platform singletons that must never be inlined into a consumer bundle:
// stateful registries where a second copy forks state. Not derivable from
// package.json (`wpScript` covers many safely inlined packages too). Keep in
// sync with the externals regex in `packages/dataviews/build.cjs`.
const SINGLETONS = new Set( [ 'data', 'hooks', 'i18n', 'date' ] );
// ROOT-relative like the metafile keys it is matched against.
const PRIVATE_APIS_DIR = 'packages/private-apis/';
const CONFIG = 'check-private-apis.config.json';

function readExceptions() {
	const { exceptions = [] } = JSON.parse(
		fs.readFileSync( new URL( CONFIG, import.meta.url ), 'utf8' )
	);
	const byPackage = new Map();
	for ( const { package: name, via } of exceptions ) {
		byPackage.set( name, [ ...( byPackage.get( name ) ?? [] ), via ] );
	}
	return byPackage;
}

function readPackageJson( name ) {
	try {
		return JSON.parse(
			fs.readFileSync(
				path.join( PACKAGES_DIR, name, 'package.json' ),
				'utf8'
			)
		);
	} catch {
		return null;
	}
}

// `module` limits the sweep to packages shipping a browser ESM build — the
// ones that can end up inlined in a consumer bundle. Node tooling packages
// (env, scripts, docgen, …) deliberately fall outside the gate. This is
// intentionally narrower than the bundled-package predicate in
// `tools/eslint/config.mjs`, which restricts direct private-apis imports in
// every bundled package, browser build or not.
function isBundled( pkgJson ) {
	return (
		pkgJson &&
		! pkgJson.private &&
		! pkgJson.wpScript &&
		! pkgJson.wpScriptModuleExports &&
		pkgJson.module
	);
}

function resolveSource( base ) {
	for ( const candidate of [
		base,
		`${ base }.ts`,
		`${ base }.tsx`,
		`${ base }.js`,
		`${ base }.jsx`,
		path.join( base, 'index.ts' ),
		path.join( base, 'index.tsx' ),
		path.join( base, 'index.js' ),
	] ) {
		if ( fs.existsSync( candidate ) && fs.statSync( candidate ).isFile() ) {
			return candidate;
		}
	}
	return null;
}

// Resolves @wordpress/* to package sources, keeps everything else external.
// Files in `exclude` (ROOT-relative) are forced external wherever they are
// imported from, so a build can answer "would private-apis still be pulled in
// without this module?".
function wordpressSources( onUnresolved, exclude ) {
	const excluded = ( resolved ) =>
		exclude.has( path.relative( ROOT, resolved ) );
	// A resolved file enters the graph marked side-effect free, unless it is
	// excluded (then it goes external under its import specifier). esbuild
	// only honors package.json `sideEffects` for files inside node_modules,
	// so plugin-resolved paths must declare here what the packages declare
	// for their published builds: their JS is side-effect free (only style
	// files are not, and those stay external). Without this, module-level
	// lock() calls in unused private-apis registries defeat tree shaking.
	const keep = ( resolved, specifier ) =>
		excluded( resolved )
			? { path: specifier, external: true }
			: { path: resolved, sideEffects: false };
	return {
		name: 'wordpress-sources',
		setup( build ) {
			build.onResolve(
				{ filter: /\.(scss|css|svg|png)$/ },
				( args ) => ( {
					path: args.path,
					external: true,
				} )
			);
			build.onResolve( { filter: /^@wordpress\// }, ( args ) => {
				const match = args.path.match( /^@wordpress\/([^/]+)(\/.*)?$/ );
				const name = match[ 1 ];
				if ( SINGLETONS.has( name ) ) {
					return { path: args.path, external: true };
				}
				const subpath = match[ 2 ];
				const resolved = resolveSource(
					path.join(
						PACKAGES_DIR,
						name,
						'src',
						subpath ? `.${ subpath }` : '.'
					)
				);
				if ( ! resolved ) {
					onUnresolved( args.path, args.importer );
					return { path: args.path, external: true };
				}
				return keep( resolved, args.path );
			} );
			build.onResolve( { filter: /^[^./]/ }, ( args ) => ( {
				path: args.path,
				external: true,
			} ) );
			// Relative imports would resolve without a plugin; intercepting
			// them only serves the `keep` contract above.
			build.onResolve( { filter: /^\./ }, ( args ) => {
				const resolved = resolveSource(
					path.resolve( path.dirname( args.importer ), args.path )
				);
				if ( ! resolved ) {
					return undefined;
				}
				return keep( resolved, args.path );
			} );
		},
	};
}

// Shortest import chain from the entry to a target file. Import edges come
// from `metafile.inputs` (the visited set); the chain is restricted to files
// that survived tree shaking.
function findChain( metafile, entry, target, kept ) {
	const previous = new Map( [ [ entry, null ] ] );
	const queue = [ entry ];
	while ( queue.length ) {
		const file = queue.shift();
		if ( file === target ) {
			const chain = [];
			for (
				let current = file;
				current;
				current = previous.get( current )
			) {
				chain.unshift( current );
			}
			return chain;
		}
		for ( const dep of metafile.inputs[ file ]?.imports ?? [] ) {
			if (
				! dep.external &&
				! previous.has( dep.path ) &&
				kept.has( dep.path )
			) {
				previous.set( dep.path, file );
				queue.push( dep.path );
			}
		}
	}
	return null;
}

async function checkPackage( name, exclude = new Set() ) {
	const entry = resolveSource( path.join( PACKAGES_DIR, name, 'src' ) );
	if ( ! entry ) {
		return { name, status: 'skipped', reason: 'no src/index entry' };
	}
	const unresolved = [];
	let result;
	try {
		result = await esbuild.build( {
			entryPoints: [ entry ],
			// Metafile keys are relative to the working directory; pin it so
			// the `packages/...` path checks hold regardless of where the
			// script is invoked from (npm workspace scripts run in tools/).
			absWorkingDir: ROOT,
			bundle: true,
			write: false,
			metafile: true,
			plugins: [
				wordpressSources(
					( specifier, importer ) =>
						unresolved.push( { specifier, importer } ),
					exclude
				),
			],
			jsx: 'automatic',
			loader: { '.js': 'jsx' },
			format: 'esm',
			logLevel: 'silent',
		} );
	} catch ( error ) {
		// Unlike a missing entry, a build error means a checkable package
		// could not be checked — fail rather than skip, so a genuine
		// breakage cannot pass CI silently.
		const [ first ] = error.errors ?? [];
		return {
			name,
			status: 'error',
			reason: first
				? `${ first.text }${
						first.location
							? ` (${ first.location.file }:${ first.location.line })`
							: ''
				  }`
				: error.message.split( '\n' )[ 0 ],
		};
	}

	const entryKey = path.relative( ROOT, entry );
	// Only files that survived tree shaking count: an unused private-apis
	// registry re-exported from a package entry is dropped from real builds.
	// Fully shaken modules are absent from the output's inputs, while used
	// barrel files stay listed at 0 bytes, so presence is the right signal.
	const kept = new Set();
	for ( const output of Object.values( result.metafile.outputs ) ) {
		for ( const file of Object.keys( output.inputs ) ) {
			kept.add( file );
		}
	}
	const offenders = [ ...kept ].filter( ( file ) =>
		file.startsWith( PRIVATE_APIS_DIR )
	);
	// The files that actually consume private-apis (the lock-unlock modules),
	// each with an import chain from the entry showing how they got pulled in.
	const culprits = offenders.length
		? [ ...kept ].filter(
				( file ) =>
					! file.startsWith( PRIVATE_APIS_DIR ) &&
					( result.metafile.inputs[ file ]?.imports ?? [] ).some(
						( dep ) =>
							! dep.external &&
							dep.path.startsWith( PRIVATE_APIS_DIR )
					)
		  )
		: [];
	// A culprit can survive with no live import edge among kept files: its
	// importer was shaken but its module-level side effects kept it. Fall back
	// to the unrestricted visited graph so the route that pulled it in is
	// still shown, labelled as such.
	const visited = new Set( Object.keys( result.metafile.inputs ) );
	const chains = culprits.map( ( culprit ) => {
		const keptChain = findChain( result.metafile, entryKey, culprit, kept );
		const chain = keptChain ??
			findChain( result.metafile, entryKey, culprit, visited ) ?? [
				culprit,
			];
		return {
			revived: ! keptChain,
			chain: [ ...chain, '@wordpress/private-apis' ],
		};
	} );
	return {
		name,
		status: offenders.length ? 'fail' : 'pass',
		chains,
		unresolved,
	};
}

async function main() {
	let positionals;
	try {
		( { positionals } = parseArgs( { allowPositionals: true } ) );
	} catch ( error ) {
		console.error( error.message );
		console.error(
			'Usage: check-private-apis.mjs [package-name ...]   # default: every bundled package'
		);
		process.exit( 2 );
	}
	const names = positionals.length
		? positionals
		: fs
				.readdirSync( PACKAGES_DIR )
				.filter( ( name ) => isBundled( readPackageJson( name ) ) );

	const exceptions = readExceptions();
	let failed = false;
	for ( const name of names ) {
		const result = await checkPackage( name );
		if ( result.status === 'skipped' ) {
			console.log( `SKIP @wordpress/${ name } (${ result.reason })` );
			continue;
		}
		if ( result.status === 'error' ) {
			failed = true;
			console.log(
				`FAIL @wordpress/${ name } — build error: ${ result.reason }`
			);
			continue;
		}
		const vias = exceptions.get( name ) ?? [];
		let { status, chains } = result;
		const stale = [];
		if ( status === 'pass' ) {
			stale.push( ...vias );
		} else if ( vias.length ) {
			const retry = await checkPackage( name, new Set( vias ) );
			if ( retry.status === 'pass' ) {
				status = 'excepted';
				// Every entry must still be load-bearing: without it (the
				// others kept), the package must fail again.
				for ( const via of vias ) {
					const others = vias.filter( ( other ) => other !== via );
					if (
						others.length &&
						( await checkPackage( name, new Set( others ) ) )
							.status === 'pass'
					) {
						stale.push( via );
					}
				}
			} else if ( retry.status === 'fail' ) {
				// Report only the routes the exceptions do not explain.
				chains = retry.chains;
			}
		}
		if ( stale.length ) {
			failed = true;
			console.log(
				`FAIL @wordpress/${ name } — stale exception${
					stale.length > 1 ? 's' : ''
				}, no longer needed, remove from ${ CONFIG }:`
			);
			for ( const via of stale ) {
				console.log( `  ${ via }` );
			}
		} else if ( status === 'pass' ) {
			console.log( `PASS @wordpress/${ name }` );
		} else if ( status === 'excepted' ) {
			console.log(
				`PASS @wordpress/${ name } (excepted via: ${ vias.join(
					', '
				) })`
			);
		} else {
			failed = true;
			console.log(
				`FAIL @wordpress/${ name } — private-apis is in the module graph${
					vias.length ? ' beyond the configured exceptions' : ''
				}:`
			);
			for ( const { revived, chain } of chains ) {
				if ( revived ) {
					console.log(
						'  (kept by module-level side effects — no live import edge; the shaken route that pulled it in:)'
					);
				}
				console.log( `  ${ chain.join( '\n    -> ' ) }` );
			}
		}
		for ( const { specifier, importer } of result.unresolved ) {
			console.log(
				`  note: could not resolve ${ specifier } to source (from ${ path.relative(
					ROOT,
					importer
				) }), kept external`
			);
		}
	}
	process.exit( failed ? 1 : 0 );
}

main();
