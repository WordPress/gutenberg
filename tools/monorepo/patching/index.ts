/**
 * Creates and applies patches for npm dependencies. install-strategy=linked
 * keeps them in node_modules/.store/, where patch-package cannot work.
 *
 * @see https://github.com/ds300/patch-package/pull/596
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import type {
	ApplyCounts,
	ApplyOutcome,
	ApplyPatchesOptions,
	ApplyToDirectoryOptions,
	CreatePatchOptions,
	CreatePatchResult,
	ExecFileError,
	FindPackageOptions,
	MainOptions,
	ParsedPatchName,
} from './types.ts';

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+].*)?$/;

/**
 * Repository root, resolved through symlinks so paths stay relative to the
 * real working tree.
 *
 * @return Absolute path to the repository root.
 */
export function getRootDir(): string {
	return fs.realpathSync(
		path.join(
			path.dirname( fileURLToPath( import.meta.url ) ),
			'../../..'
		)
	);
}

/**
 * Build the patch filename for a package, using `+` in place of the scope
 * separator so the name survives as a single path segment.
 *
 * @param packageName Package name, e.g. "@scope/name".
 * @param version     Exact installed version.
 * @return The patch filename.
 */
export function patchFileName( packageName: string, version: string ): string {
	return `${ packageName.replace( '/', '+' ) }+${ version }.patch`;
}

/**
 * Parse a patch filename back into a package name and version.
 *
 * @param filename Patch filename, e.g. "@scope+name+1.2.3.patch".
 * @return The parsed name and version, or null when unparseable.
 */
export function parsePatchFileName( filename: string ): ParsedPatchName | null {
	if ( ! filename.endsWith( '.patch' ) ) {
		return null;
	}

	const stem = filename.slice( 0, -'.patch'.length );

	/*
	 * `+` encodes the scope separator and also separates the version, so the
	 * split is ambiguous. npm names cannot contain `+`, which leaves exactly
	 * one candidate whose decoded name is well formed.
	 */
	for (
		let at = stem.indexOf( '+' );
		at !== -1;
		at = stem.indexOf( '+', at + 1 )
	) {
		const version = stem.slice( at + 1 );
		if ( ! VERSION_PATTERN.test( version ) ) {
			continue;
		}

		const rawName = stem.slice( 0, at );
		if ( ! rawName.startsWith( '@' ) ) {
			if ( ! rawName.includes( '+' ) ) {
				return { packageName: rawName, version };
			}
			continue;
		}

		// A scoped name carries exactly one `+`, restored as the separator.
		const packageName = rawName.replace( '+', '/' );
		if ( packageName.includes( '/' ) && ! packageName.includes( '+' ) ) {
			return { packageName, version };
		}
	}

	return null;
}

/**
 * Expand the root package.json workspace globs into directory paths. Only the
 * trailing `/*` form the repository uses is supported.
 *
 * @param rootDir Repository root.
 * @return Absolute paths to every workspace directory.
 */
export function getWorkspaceDirs( rootDir: string ): string[] {
	const manifestPath = path.join( rootDir, 'package.json' );
	if ( ! fs.existsSync( manifestPath ) ) {
		return [];
	}

	const patterns = readWorkspacePatterns( manifestPath );
	const excluded = new Set< string >();
	const included = new Set< string >();

	for ( const pattern of patterns ) {
		const negated = pattern.startsWith( '!' );
		const value = negated ? pattern.slice( 1 ) : pattern;
		const target = negated ? excluded : included;

		if ( ! value.endsWith( '/*' ) ) {
			target.add( value );
			continue;
		}

		const prefix = value.slice( 0, -2 );
		const parent = path.join( rootDir, prefix );
		if ( ! fs.existsSync( parent ) ) {
			continue;
		}

		const entries = fs.readdirSync( parent, { withFileTypes: true } );
		for ( const entry of entries ) {
			if ( entry.isDirectory() ) {
				target.add( `${ prefix }/${ entry.name }` );
			}
		}
	}

	return [ ...included ]
		.filter( ( relative ) => ! excluded.has( relative ) )
		.map( ( relative ) => path.join( rootDir, relative ) );
}

/**
 * Locate every copy of a package inside node_modules/.store/. A single
 * name and version can appear under more than one content hash.
 *
 * @param storeDir    Absolute path to node_modules/.store.
 * @param packageName Package name.
 * @param version     Exact version, or undefined to accept any.
 * @return Absolute paths to every matching package directory.
 */
function findInStore(
	storeDir: string,
	packageName: string,
	version?: string
): string[] {
	/*
	 * Scoped packages nest one level deeper:
	 * .store/@scope/name@<version>-<hash>/node_modules/@scope/name
	 */
	const scope = packageName.startsWith( '@' )
		? packageName.split( '/' )[ 0 ]
		: null;
	const searchDir = scope ? path.join( storeDir, scope ) : storeDir;
	const bareName = scope
		? packageName.slice( scope.length + 1 )
		: packageName;

	if ( ! fs.existsSync( searchDir ) ) {
		return [];
	}

	const found: string[] = [];

	for ( const entry of fs.readdirSync( searchDir ) ) {
		if ( ! entry.startsWith( `${ bareName }@` ) ) {
			continue;
		}

		const packageDir = path.join(
			searchDir,
			entry,
			'node_modules',
			packageName
		);
		if ( ! fs.existsSync( packageDir ) ) {
			continue;
		}

		/*
		 * The directory name embeds a content hash, so `foo@1.2.3-<hash>` and
		 * `foo@1.2.3-beta-<hash>` share a prefix. Trust the manifest instead.
		 */
		if ( version && readPackageVersion( packageDir ) !== version ) {
			continue;
		}

		found.push( packageDir );
	}

	return found;
}

/**
 * Resolve an installed package to every real directory holding it, covering
 * the hoisted layout, workspace-nested copies, and the linked .store.
 *
 * @param options             Lookup options.
 * @param options.rootDir     Repository root.
 * @param options.packageName Package name.
 * @param options.version     Exact version, or undefined to accept any.
 * @return Absolute paths, deduplicated, in resolution order.
 */
export function findPackageDirs( {
	rootDir,
	packageName,
	version,
}: FindPackageOptions ): string[] {
	const candidates = [
		path.join( rootDir, 'node_modules', packageName ),
		...getWorkspaceDirs( rootDir ).map( ( workspaceDir ) =>
			path.join( workspaceDir, 'node_modules', packageName )
		),
	];
	const found = new Set< string >();

	for ( const candidate of candidates ) {
		if ( ! fs.existsSync( candidate ) ) {
			continue;
		}
		/*
		 * Under the linked strategy these are symlinks into .store. Resolve
		 * them, as git apply refuses to touch files beyond a symbolic link.
		 */
		const resolved = fs.realpathSync( candidate );
		if ( version && readPackageVersion( resolved ) !== version ) {
			continue;
		}
		found.add( resolved );
	}

	const storeDir = path.join( rootDir, 'node_modules', '.store' );
	if ( fs.existsSync( storeDir ) ) {
		for ( const dir of findInStore( storeDir, packageName, version ) ) {
			found.add( fs.realpathSync( dir ) );
		}
	}

	return [ ...found ];
}

/**
 * Resolve an installed package to a single directory.
 *
 * @param options Lookup options.
 * @return Absolute path to the package directory, or null when not installed.
 */
export function findPackageDir( options: FindPackageOptions ): string | null {
	return findPackageDirs( options )[ 0 ] ?? null;
}

/**
 * Read the version field of an installed package.
 *
 * @param packageDir Absolute path to the package directory.
 * @return The version, or null when the manifest is missing or unreadable.
 */
export function readPackageVersion( packageDir: string ): string | null {
	let manifest: unknown;
	try {
		manifest = JSON.parse(
			fs.readFileSync( path.join( packageDir, 'package.json' ), 'utf8' )
		);
	} catch {
		return null;
	}

	if (
		typeof manifest === 'object' &&
		manifest !== null &&
		'version' in manifest &&
		typeof manifest.version === 'string'
	) {
		return manifest.version;
	}

	return null;
}

/**
 * Read the workspace globs a manifest declares, ignoring anything malformed.
 *
 * @param manifestPath Absolute path to a package.json.
 * @return The declared globs.
 */
function readWorkspacePatterns( manifestPath: string ): string[] {
	let manifest: unknown;
	try {
		manifest = JSON.parse( fs.readFileSync( manifestPath, 'utf8' ) );
	} catch {
		return [];
	}

	if (
		typeof manifest === 'object' &&
		manifest !== null &&
		'workspaces' in manifest &&
		Array.isArray( manifest.workspaces )
	) {
		return manifest.workspaces.filter(
			( pattern: unknown ): pattern is string =>
				typeof pattern === 'string'
		);
	}

	return [];
}

/**
 * Narrow a thrown value to something whose exec fields can be read. Every
 * field is optional, so a plain Error needs no cast.
 *
 * @param error The caught value.
 * @return The same error, or a new one wrapping a non-Error throw.
 */
function toExecError( error: unknown ): ExecFileError {
	return error instanceof Error ? error : new Error( String( error ) );
}

/**
 * Header lines that carry a path git will act on. Hunk payloads are never
 * touched, so source text that looks like a path is left alone.
 */
const PATH_HEADER_PREFIXES = [
	'diff --git ',
	'--- ',
	'+++ ',
	'rename from ',
	'rename to ',
	'copy from ',
	'copy to ',
];

const HUNK_HEADER = /^@@+ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/;

/**
 * Replace path prefixes on the header lines of a patch. Hunk bodies are
 * tracked and skipped, because a removed line reading `-- x` arrives as
 * `--- x` and would otherwise look like a file header.
 *
 * @param patchContent Patch text.
 * @param rewrite      Maps a header line to its replacement.
 * @return The rewritten patch text.
 */
function rewriteHeaderLines(
	patchContent: string,
	rewrite: ( line: string ) => string
): string {
	// Context lines count against both sides, so the two are tracked apart.
	let oldRemaining = 0;
	let newRemaining = 0;

	return patchContent
		.split( '\n' )
		.map( ( line ) => {
			const inHunk = oldRemaining > 0 || newRemaining > 0;

			// A new file section ends any hunk, even a malformed one.
			if ( inHunk && ! line.startsWith( 'diff --git ' ) ) {
				if ( line.startsWith( '-' ) ) {
					oldRemaining -= 1;
				} else if ( line.startsWith( '+' ) ) {
					newRemaining -= 1;
				} else if ( ! line.startsWith( '\\' ) ) {
					// Context, including a blank line written without its space.
					oldRemaining -= 1;
					newRemaining -= 1;
				}
				return line;
			}

			const hunk = line.match( HUNK_HEADER );
			if ( hunk ) {
				oldRemaining =
					hunk[ 1 ] === undefined ? 1 : Number( hunk[ 1 ] );
				newRemaining =
					hunk[ 2 ] === undefined ? 1 : Number( hunk[ 2 ] );
				return line;
			}

			oldRemaining = 0;
			newRemaining = 0;

			return PATH_HEADER_PREFIXES.some( ( prefix ) =>
				line.startsWith( prefix )
			)
				? rewrite( line )
				: line;
		} )
		.join( '\n' );
}

/**
 * Rewrite a patch so its `a/` and `b/` paths point at the package's real
 * location instead of the nested node_modules path it was authored against.
 *
 * @param patchContent Patch text.
 * @param packageName  Package name the patch targets.
 * @param relativeDir  Package directory, relative to the repository root.
 * @return The rewritten patch text.
 */
export function retargetPatch(
	patchContent: string,
	packageName: string,
	relativeDir: string
): string {
	// Forward slashes always, git apply rejects backslashes on Windows.
	const target = relativeDir.split( path.sep ).join( '/' );
	const authored = `node_modules/${ packageName }/`;

	return rewriteHeaderLines( patchContent, ( line ) =>
		line.split( authored ).join( `${ target }/` )
	);
}

function runGit( args: string[], cwd: string ): Buffer {
	return execFileSync( 'git', args, { cwd, stdio: 'pipe' } );
}

/**
 * Apply every patch in the patches directory. Patches that are already applied
 * are left alone, so repeat installs are idempotent.
 *
 * @param options         Apply options.
 * @param options.rootDir Repository root.
 * @param options.log     Message sink.
 * @return Counts of applied, skipped and failed patches.
 */
export function applyPatches( {
	rootDir,
	log = console,
}: ApplyPatchesOptions ): ApplyCounts {
	const patchesDir = path.join( rootDir, 'patches' );
	const result: ApplyCounts = { applied: 0, skipped: 0, failed: 0 };

	if ( ! fs.existsSync( patchesDir ) ) {
		return result;
	}

	const patchFiles = fs
		.readdirSync( patchesDir )
		.filter( ( file ) => file.endsWith( '.patch' ) )
		.sort();

	for ( const patchFile of patchFiles ) {
		const parsed = parsePatchFileName( patchFile );
		if ( ! parsed ) {
			log.error( `  ✖ ${ patchFile } is not a valid patch filename` );
			result.failed += 1;
			continue;
		}

		const { packageName, version } = parsed;
		const packageDirs = findPackageDirs( {
			rootDir,
			packageName,
			version,
		} );

		if ( packageDirs.length === 0 ) {
			log.error( `  ✖ ${ packageName }@${ version } is not installed` );
			result.failed += 1;
			continue;
		}

		const patchContent = fs.readFileSync(
			path.join( patchesDir, patchFile ),
			'utf8'
		);

		// A dependency can exist as several store copies; every one needs patching.
		for ( const packageDir of packageDirs ) {
			const outcome = applyToDirectory( {
				rootDir,
				packageDir,
				packageName,
				patchContent,
				log,
				label:
					packageDirs.length > 1
						? `${ patchFile } (${ path.relative(
								rootDir,
								packageDir
							) })`
						: patchFile,
			} );
			result[ outcome ] += 1;
		}
	}

	return result;
}

/**
 * Apply one patch to one installed copy of a package.
 *
 * @param options              Apply options.
 * @param options.rootDir      Repository root.
 * @param options.packageDir   The copy to patch.
 * @param options.packageName  Package name the patch targets.
 * @param options.patchContent Patch text as authored.
 * @param options.label        Name to use in messages.
 * @param options.log          Message sink.
 * @return What happened.
 */
function applyToDirectory( {
	rootDir,
	packageDir,
	packageName,
	patchContent,
	label,
	log,
}: ApplyToDirectoryOptions ): ApplyOutcome {
	const retargeted = retargetPatch(
		patchContent,
		packageName,
		path.relative( rootDir, packageDir )
	);
	const tmpDir = fs.mkdtempSync( path.join( os.tmpdir(), 'wp-patch-' ) );
	const tmpPatch = path.join( tmpDir, 'current.patch' );

	try {
		fs.writeFileSync( tmpPatch, retargeted );

		const forwardApplies = canApply( tmpPatch, rootDir, false );
		const reverseApplies = canApply( tmpPatch, rootDir, true );

		/*
		 * --unidiff-zero is needed for zero-context hunks but makes matching
		 * loose, so require the reverse direction to be the only one that fits.
		 */
		if ( reverseApplies && ! forwardApplies ) {
			log.log( `  ✔ ${ label } already applied` );
			return 'skipped';
		}

		if ( ! forwardApplies ) {
			log.error( `  ✖ ${ label } does not apply cleanly` );
			return 'failed';
		}

		runGit(
			[ 'apply', '--unidiff-zero', '--ignore-whitespace', tmpPatch ],
			rootDir
		);
		log.log( `  ✔ Applied ${ label }` );
		return 'applied';
	} catch ( error ) {
		const failure = toExecError( error );
		const detail =
			failure.stderr?.toString() ||
			failure.stdout?.toString() ||
			failure.message;
		log.error( `  ✖ Failed to apply ${ label }: ${ detail }` );
		return 'failed';
	} finally {
		fs.rmSync( tmpDir, { recursive: true, force: true } );
	}
}

/**
 * Test whether a patch applies, in either direction, without changing anything.
 *
 * @param patchPath Patch file to test.
 * @param cwd       Directory to test against.
 * @param reverse   Test the reverse direction.
 * @return Whether git apply would succeed.
 */
function canApply( patchPath: string, cwd: string, reverse: boolean ): boolean {
	try {
		runGit(
			[
				'apply',
				'--check',
				...( reverse ? [ '--reverse' ] : [] ),
				'--unidiff-zero',
				'--ignore-whitespace',
				patchPath,
			],
			cwd
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * Download and unpack the published tarball for a package version.
 *
 * @param packageName Package name.
 * @param version     Exact version.
 * @param destination Directory to unpack into.
 * @return Absolute path to the unpacked package directory.
 */
export function fetchPristinePackage(
	packageName: string,
	version: string,
	destination: string
): string {
	fs.mkdirSync( destination, { recursive: true } );
	execFileSync(
		'npm',
		[
			'pack',
			`${ packageName }@${ version }`,
			'--pack-destination',
			destination,
			'--silent',
			'--ignore-scripts',
		],
		{ stdio: 'pipe' }
	);

	const tarball = fs
		.readdirSync( destination )
		.find( ( file ) => file.endsWith( '.tgz' ) );
	if ( ! tarball ) {
		throw new Error(
			`npm pack produced no tarball for ${ packageName }@${ version }`
		);
	}

	execFileSync( 'tar', [ '-xzf', tarball ], {
		cwd: destination,
		stdio: 'pipe',
	} );

	return path.join( destination, 'package' );
}

/**
 * Copy an installed package, leaving out its nested node_modules. Those hold
 * symlinks into the store, which are not part of the package's own source.
 *
 * @param packageDir  Installed package directory.
 * @param destination Directory to copy into.
 */
function copyPackageSource( packageDir: string, destination: string ): void {
	fs.cpSync( packageDir, destination, {
		recursive: true,
		dereference: true,
		filter: ( source: string ) => {
			const relative = path.relative( packageDir, source );
			return ! relative.split( path.sep ).includes( 'node_modules' );
		},
	} );
}

/**
 * Diff the installed copy of a package against its published tarball and write
 * the result to patches/. Replaces an existing patch for the same package.
 *
 * @param options               Create options.
 * @param options.rootDir       Repository root.
 * @param options.packageName   Package name to patch.
 * @param options.fetchPristine Tarball fetcher, injectable for tests.
 * @param options.log           Message sink.
 * @return The patch path and whether anything was written.
 */
export function createPatch( {
	rootDir,
	packageName,
	fetchPristine = fetchPristinePackage,
	log = console,
}: CreatePatchOptions ): CreatePatchResult {
	const packageDirs = findPackageDirs( { rootDir, packageName } );
	if ( packageDirs.length === 0 ) {
		throw new Error( `${ packageName } is not installed` );
	}

	const [ packageDir ] = packageDirs;
	if ( packageDirs.length > 1 ) {
		log.warn?.(
			`  ${ packageName } is installed ${
				packageDirs.length
			} times; diffing ${ path.relative( rootDir, packageDir ) }`
		);
	}

	const version = readPackageVersion( packageDir );
	if ( ! version ) {
		throw new Error( `Could not read the version of ${ packageName }` );
	}

	const workDir = fs.mkdtempSync(
		path.join( os.tmpdir(), 'wp-patch-create-' )
	);

	try {
		const pristineDir = path.join( workDir, 'pristine' );
		const currentDir = path.join( workDir, 'current' );

		fs.renameSync(
			fetchPristine(
				packageName,
				version,
				path.join( workDir, 'download' )
			),
			pristineDir
		);
		copyPackageSource( packageDir, currentDir );

		let diff = '';
		try {
			/*
			 * --no-index exits 1 when the trees differ, which is the expected
			 * outcome here, so the diff is read from the thrown error instead.
			 */
			runGit(
				[
					'diff',
					'--no-index',
					'--no-color',
					'--no-ext-diff',
					// Without --binary a binary change diffs to an unappliable stub.
					'--binary',
					'pristine',
					'current',
				],
				workDir
			);
		} catch ( error ) {
			const failure = toExecError( error );
			if ( failure.status !== 1 ) {
				throw new Error(
					failure.stderr?.toString() ||
						failure.message ||
						'git diff failed'
				);
			}
			diff = failure.stdout?.toString() ?? '';
		}

		const patchPath = path.join(
			rootDir,
			'patches',
			patchFileName( packageName, version )
		);

		if ( ! diff.trim() ) {
			log.log( `  No changes found in ${ packageName }@${ version }` );
			if ( fs.existsSync( patchPath ) ) {
				fs.rmSync( patchPath );
				log.log( `  Removed ${ path.basename( patchPath ) }` );
			}
			return { patchPath, written: false };
		}

		// Re-root the diff on the nested path the patch format expects.
		const nested = `node_modules/${ packageName }`;
		const content = rewriteHeaderLines( diff, ( line ) =>
			line
				.split( 'a/pristine/' )
				.join( `a/${ nested }/` )
				.split( 'b/current/' )
				.join( `b/${ nested }/` )
				.split( 'a/current/' )
				.join( `a/${ nested }/` )
				.split( 'b/pristine/' )
				.join( `b/${ nested }/` )
				.split( 'rename from pristine/' )
				.join( `rename from ${ nested }/` )
				.split( 'rename to current/' )
				.join( `rename to ${ nested }/` )
				.split( 'copy from pristine/' )
				.join( `copy from ${ nested }/` )
				.split( 'copy to current/' )
				.join( `copy to ${ nested }/` )
		);

		fs.mkdirSync( path.dirname( patchPath ), { recursive: true } );
		fs.writeFileSync( patchPath, content );
		log.log( `  ✔ Wrote ${ path.basename( patchPath ) }` );

		return { patchPath, written: true };
	} finally {
		fs.rmSync( workDir, { recursive: true, force: true } );
	}
}

const USAGE = `Usage:
  patch apply              Apply every patch in patches/
  patch create <package>   Diff an installed package and write patches/<name>+<version>.patch
  patch update <package>   Alias for create

Options:
  -h, --help               Show this message
`;

/**
 * CLI entry point.
 *
 * @param argv            Arguments; defaults to the process arguments.
 * @param options         Runtime options.
 * @param options.rootDir Repository root.
 * @param options.log     Message sink.
 * @return Process exit code.
 */
export function main(
	argv?: string[],
	{ rootDir = getRootDir(), log = console }: MainOptions = {}
): number {
	let values: { help?: boolean } = {};
	let positionals: string[] = [];
	try {
		// Strict parsing so an unknown flag is reported, not read as a package name.
		( { values, positionals } = parseArgs( {
			args: argv,
			options: { help: { type: 'boolean', short: 'h' } },
			allowPositionals: true,
			strict: true,
		} ) );
	} catch ( error ) {
		log.error( toExecError( error ).message );
		log.error( USAGE );
		return 1;
	}

	const [ command = 'apply', ...rest ] = positionals;

	if ( values.help ) {
		log.log( USAGE );
		return 0;
	}

	if ( command === 'apply' ) {
		if ( rest.length > 0 ) {
			log.error(
				`apply takes no arguments, received: ${ rest.join( ' ' ) }`
			);
			log.error( USAGE );
			return 1;
		}
		const { failed } = applyPatches( { rootDir, log } );
		return failed > 0 ? 1 : 0;
	}

	if ( command === 'create' || command === 'update' ) {
		const [ packageName, ...extra ] = rest;
		if ( ! packageName ) {
			log.error( 'A package name is required.' );
			log.error( USAGE );
			return 1;
		}
		if ( extra.length > 0 ) {
			log.error(
				`Only one package at a time, received: ${ rest.join( ' ' ) }`
			);
			log.error( USAGE );
			return 1;
		}
		try {
			createPatch( { rootDir, packageName, log } );
			return 0;
		} catch ( error ) {
			log.error( `  ✖ ${ toExecError( error ).message }` );
			return 1;
		}
	}

	log.error( `Unknown command: ${ command }` );
	log.error( USAGE );
	return 1;
}

if ( import.meta.main ) {
	process.exitCode = main();
}
