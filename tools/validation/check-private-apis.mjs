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
const SINGLETONS = new Set( [ 'data', 'hooks', 'i18n', 'date' ] );

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

function isBundled( pkgJson ) {
	return (
		pkgJson &&
		! pkgJson.private &&
		! pkgJson.wpScript &&
		! pkgJson.wpScriptModuleExports
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
function wordpressSources( onUnresolved ) {
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
				// esbuild does not read package.json for plugin-resolved paths,
				// so declare what the packages themselves declare: their JS is
				// side-effect free (only style files are not, and those stay
				// external here). Without this, module-level lock() calls in
				// unused private-apis registries defeat tree shaking.
				return { path: resolved, sideEffects: false };
			} );
			build.onResolve( { filter: /^[^./]/ }, ( args ) => ( {
				path: args.path,
				external: true,
			} ) );
			// esbuild only honors package.json `sideEffects` for files inside
			// node_modules, so relative imports between source files must be
			// marked side-effect free here too. Matches what the packages
			// declare for their published builds.
			build.onResolve( { filter: /^\./ }, ( args ) => {
				const resolved = resolveSource(
					path.resolve( path.dirname( args.importer ), args.path )
				);
				return resolved
					? { path: resolved, sideEffects: false }
					: undefined;
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

async function checkPackage( name ) {
	const entry = resolveSource( path.join( PACKAGES_DIR, name, 'src' ) );
	if ( ! entry ) {
		return { name, status: 'skipped', reason: 'no src/index entry' };
	}
	const unresolved = [];
	let result;
	try {
		result = await esbuild.build( {
			entryPoints: [ entry ],
			bundle: true,
			write: false,
			metafile: true,
			plugins: [
				wordpressSources( ( specifier, importer ) =>
					unresolved.push( { specifier, importer } )
				),
			],
			jsx: 'automatic',
			loader: { '.js': 'jsx' },
			format: 'esm',
			logLevel: 'silent',
		} );
	} catch ( error ) {
		return {
			name,
			status: 'skipped',
			reason: `build error: ${ error.message.split( '\n' )[ 0 ] }`,
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
		file.startsWith( 'packages/private-apis/' )
	);
	// The files that actually consume private-apis (the lock-unlock modules),
	// each with an import chain from the entry showing how they got pulled in.
	const culprits = offenders.length
		? [ ...kept ].filter(
				( file ) =>
					! file.startsWith( 'packages/private-apis/' ) &&
					( result.metafile.inputs[ file ]?.imports ?? [] ).some(
						( dep ) =>
							! dep.external &&
							dep.path.startsWith( 'packages/private-apis/' )
					)
		  )
		: [];
	const chains = culprits.map( ( culprit ) => [
		...( findChain( result.metafile, entryKey, culprit, kept ) ?? [
			culprit,
		] ),
		'@wordpress/private-apis',
	] );
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

	let failed = false;
	for ( const name of names ) {
		const { status, reason, chains, unresolved } =
			await checkPackage( name );
		if ( status === 'skipped' ) {
			console.log( `SKIP @wordpress/${ name } (${ reason })` );
			continue;
		}
		if ( status === 'pass' ) {
			console.log( `PASS @wordpress/${ name }` );
		} else {
			failed = true;
			console.log(
				`FAIL @wordpress/${ name } — private-apis is in the module graph:`
			);
			for ( const chain of chains ) {
				console.log( `  ${ chain.join( '\n    -> ' ) }` );
			}
		}
		for ( const { specifier, importer } of unresolved ) {
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
