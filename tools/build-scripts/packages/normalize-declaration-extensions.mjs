#!/usr/bin/env node

/**
 * Adds explicit file extensions to relative import/export specifiers in the
 * compiled type declarations of `"type": "module"` packages.
 *
 * `tsc` emits declaration specifiers verbatim from source, and the shared
 * config authors extensionless relative imports (valid under
 * `moduleResolution: "bundler"`). Because these packages are ESM, Node-style
 * resolution (`node16`/`nodenext`) rejects extensionless relative specifiers in
 * the published `.d.ts` graph, which `@arethetypeswrong/cli` reports as an
 * `InternalResolutionError`.
 *
 * This mirrors what esbuild already does for the runtime `build-module` output
 * (which emits `./foo.mjs`), normalizing the declaration emit as a shared
 * post-`tsc` step rather than a per-package workaround.
 *
 * A relative specifier is resolved against the emitted declaration graph and
 * rewritten to point at the runtime counterpart of its target:
 *   - `./foo`       -> `./foo.js`        (target `foo.d.ts`)
 *   - `./foo`       -> `./foo.mjs`       (target `foo.d.mts`)
 *   - `./foo`       -> `./foo.cjs`       (target `foo.d.cts`)
 *   - `./dir`       -> `./dir/index.js`  (target `dir/index.d.ts`)
 * TypeScript maps the `.js`/`.mjs`/`.cjs` specifier back to the sibling
 * declaration during resolution, so this is valid for both bundler and
 * Node-style ESM consumers.
 *
 * @see https://github.com/WordPress/gutenberg/issues/80206
 */

/**
 * External dependencies
 */
import { readdir, readFile, writeFile, access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../../..' );

// The packages directory to scan. Defaults to the repo's `packages`; an
// explicit path can be passed as the first argument (used by tests).
const PACKAGES_DIR = process.argv[ 2 ]
	? path.resolve( process.argv[ 2 ] )
	: path.join( ROOT_DIR, 'packages' );

// Declaration extension -> runtime extension the specifier should point at.
const DECLARATION_TO_RUNTIME = [
	[ '.d.mts', '.mjs' ],
	[ '.d.cts', '.cjs' ],
	[ '.d.ts', '.js' ],
];

// Specifiers already carrying one of these are left untouched.
const KNOWN_EXTENSIONS = [
	'.js',
	'.mjs',
	'.cjs',
	'.jsx',
	'.json',
	'.css',
	'.node',
	'.wasm',
];

/**
 * Matches the specifier of a relative `import`/`export ... from`, side-effect
 * `import`, and (inline or dynamic) `import(...)`. Capture groups: prefix,
 * quote, specifier, closing quote.
 */
const SPECIFIER_RE =
	/(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.\.?\/[^'"]*)(['"])/g;

/**
 * Whether a filesystem path exists.
 *
 * @param {string} filePath Absolute path.
 * @return {Promise<boolean>} Whether the path exists.
 */
async function exists( filePath ) {
	try {
		await access( filePath );
		return true;
	} catch {
		return false;
	}
}

/**
 * Resolves a relative specifier against the emitted declaration graph and
 * returns the runtime extension (or `/index.*`) it should be rewritten with, or
 * `null` when it should be left unchanged.
 *
 * @param {string} fromDir   Directory of the file containing the specifier.
 * @param {string} specifier The relative specifier, e.g. `./foo`.
 * @return {Promise<string|null>} The suffix to append, or `null`.
 */
async function resolveSuffix( fromDir, specifier ) {
	// Already carries a meaningful extension.
	if ( KNOWN_EXTENSIONS.some( ( ext ) => specifier.endsWith( ext ) ) ) {
		return null;
	}

	const target = path.resolve( fromDir, specifier );

	// Direct file match: `./foo` -> `./foo.<runtime>`.
	for ( const [ decExt, runtimeExt ] of DECLARATION_TO_RUNTIME ) {
		if ( await exists( target + decExt ) ) {
			return runtimeExt;
		}
	}

	// Directory match: `./dir` -> `./dir/index.<runtime>`.
	for ( const [ decExt, runtimeExt ] of DECLARATION_TO_RUNTIME ) {
		if ( await exists( path.join( target, `index${ decExt }` ) ) ) {
			return `/index${ runtimeExt }`;
		}
	}

	return null;
}

/**
 * Rewrites the relative specifiers of a single declaration file in place.
 *
 * @param {string} file Absolute path to a declaration file.
 * @return {Promise<number>} Number of specifiers rewritten.
 */
async function normalizeFile( file ) {
	const source = await readFile( file, 'utf8' );
	const fromDir = path.dirname( file );

	// Collect matches first because the replacement is async.
	const matches = [ ...source.matchAll( SPECIFIER_RE ) ];
	const replacements = await Promise.all(
		matches.map( async ( match ) => {
			const [ , , , specifier ] = match;
			return resolveSuffix( fromDir, specifier );
		} )
	);

	let rewritten = 0;
	let index = 0;
	const output = source.replace(
		SPECIFIER_RE,
		( full, prefix, quote, specifier, closingQuote ) => {
			const suffix = replacements[ index++ ];
			if ( suffix === null ) {
				return full;
			}
			rewritten++;
			return `${ prefix }${ quote }${ specifier }${ suffix }${ closingQuote }`;
		}
	);

	if ( rewritten > 0 ) {
		await writeFile( file, output );
	}
	return rewritten;
}

/**
 * Recursively collects declaration files under a directory.
 *
 * @param {string} dir Directory to walk.
 * @return {Promise<string[]>} Absolute paths of declaration files.
 */
async function collectDeclarationFiles( dir ) {
	const entries = await readdir( dir, { withFileTypes: true } );
	const files = await Promise.all(
		entries.map( async ( entry ) => {
			const full = path.join( dir, entry.name );
			if ( entry.isDirectory() ) {
				return collectDeclarationFiles( full );
			}
			// Skip declaration maps; only rewrite declaration files.
			return /\.d\.(ts|mts|cts)$/.test( entry.name ) ? [ full ] : [];
		} )
	);
	return files.flat();
}

/**
 * Whether a package publishes ESM declarations that need normalization, i.e. it
 * declares `"type": "module"` and has a `build-types` directory.
 *
 * @param {string} packagePath Absolute path to the package.
 * @return {Promise<boolean>} Whether the package needs normalization.
 */
async function packageNeedsNormalization( packagePath ) {
	try {
		const pkg = JSON.parse(
			await readFile( path.join( packagePath, 'package.json' ), 'utf8' )
		);
		if ( pkg.type !== 'module' ) {
			return false;
		}
	} catch {
		return false;
	}
	return exists( path.join( packagePath, 'build-types' ) );
}

async function normalizeDeclarationExtensions() {
	const packageDirs = (
		await readdir( PACKAGES_DIR, { withFileTypes: true } )
	)
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => path.join( PACKAGES_DIR, dirent.name ) );

	let totalRewritten = 0;
	for ( const packageDir of packageDirs ) {
		if ( ! ( await packageNeedsNormalization( packageDir ) ) ) {
			continue;
		}

		const files = await collectDeclarationFiles(
			path.join( packageDir, 'build-types' )
		);
		const counts = await Promise.all( files.map( normalizeFile ) );
		const rewritten = counts.reduce( ( sum, count ) => sum + count, 0 );

		if ( rewritten > 0 ) {
			totalRewritten += rewritten;
			console.log(
				`   ✔ ${ path.basename(
					packageDir
				) }: normalized ${ rewritten } declaration specifier(s)`
			);
		}
	}

	if ( totalRewritten === 0 ) {
		console.log(
			'   ✔ No declaration specifiers required normalization.'
		);
	}
}

normalizeDeclarationExtensions().catch( ( error ) => {
	console.error( error );
	process.exit( 1 );
} );
