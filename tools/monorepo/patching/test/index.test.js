import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
	applyPatches,
	createPatch,
	findPackageDir,
	findPackageDirs,
	getWorkspaceDirs,
	main,
	parsePatchFileName,
	patchFileName,
	retargetPatch,
} from '../index.mjs';

const temporaryRoots = [];
const silentLog = { log() {}, warn() {}, error() {} };

afterEach( () => {
	for ( const root of temporaryRoots.splice( 0 ) ) {
		fs.rmSync( root, { recursive: true, force: true } );
	}
} );

function createRepository( { workspaces = [] } = {} ) {
	const rootDir = fs.realpathSync(
		fs.mkdtempSync( path.join( os.tmpdir(), 'gutenberg-patch-' ) )
	);
	temporaryRoots.push( rootDir );

	writeJson( path.join( rootDir, 'package.json' ), {
		name: 'fixture',
		private: true,
		workspaces,
	} );
	fs.mkdirSync( path.join( rootDir, 'patches' ), { recursive: true } );
	execFileSync( 'git', [ 'init', '-q' ], { cwd: rootDir, stdio: 'pipe' } );

	return rootDir;
}

function writeJson( filePath, value ) {
	fs.mkdirSync( path.dirname( filePath ), { recursive: true } );
	fs.writeFileSync( filePath, `${ JSON.stringify( value, null, 2 ) }\n` );
}

/*
 * Install a package into the fake .store, mirroring the linked layout, and
 * symlink it under the given consumer so both lookup paths are exercised.
 */
function installLinked(
	rootDir,
	{ name, version, files, consumer, hash = 'hash' }
) {
	const scope = name.startsWith( '@' ) ? name.split( '/' )[ 0 ] : null;
	const bareName = scope ? name.slice( scope.length + 1 ) : name;
	const entry = path.join(
		rootDir,
		'node_modules/.store',
		scope ?? '',
		`${ bareName }@${ version }-${ hash }`,
		'node_modules',
		name
	);

	writeJson( path.join( entry, 'package.json' ), { name, version } );
	for ( const [ relative, contents ] of Object.entries( files ) ) {
		fs.mkdirSync( path.dirname( path.join( entry, relative ) ), {
			recursive: true,
		} );
		fs.writeFileSync( path.join( entry, relative ), contents );
	}

	if ( consumer ) {
		const link = path.join( rootDir, consumer, 'node_modules', name );
		fs.mkdirSync( path.dirname( link ), { recursive: true } );
		fs.symlinkSync( entry, link );
	}

	return entry;
}

describe( 'patch filenames', () => {
	test.each( [
		[ 'react-autosize-textarea', '7.1.0' ],
		[ '@arraypress/waveform-player', '1.26.0' ],
	] )( 'round-trips %s@%s', ( name, version ) => {
		const filename = patchFileName( name, version );

		expect( parsePatchFileName( filename ) ).toEqual( {
			packageName: name,
			version,
		} );
	} );

	test( 'encodes the scope separator as a single path segment', () => {
		expect( patchFileName( '@scope/name', '1.2.3' ) ).toBe(
			'@scope+name+1.2.3.patch'
		);
	} );

	test( 'keeps prerelease and build metadata in the version', () => {
		expect( parsePatchFileName( 'pkg+1.2.3-beta.1.patch' ) ).toEqual( {
			packageName: 'pkg',
			version: '1.2.3-beta.1',
		} );
	} );

	test( 'returns null for filenames it cannot parse', () => {
		expect( parsePatchFileName( 'not-a-patch.txt' ) ).toBeNull();
		expect( parsePatchFileName( 'missing-version.patch' ) ).toBeNull();
	} );
} );

describe( 'getWorkspaceDirs', () => {
	test( 'expands globs and honours negations', () => {
		const rootDir = createRepository( {
			workspaces: [ 'packages/*', 'tools/*', '!tools/excluded' ],
		} );
		for ( const dir of [
			'packages/components',
			'tools/monorepo',
			'tools/excluded',
		] ) {
			fs.mkdirSync( path.join( rootDir, dir ), { recursive: true } );
		}

		const found = getWorkspaceDirs( rootDir )
			.map( ( dir ) => path.relative( rootDir, dir ) )
			.sort();

		expect( found ).toEqual( [ 'packages/components', 'tools/monorepo' ] );
	} );
} );

describe( 'findPackageDir', () => {
	test( 'finds an unscoped transitive dependency in the store', () => {
		const rootDir = createRepository( { workspaces: [ 'packages/*' ] } );
		const entry = installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0',
			files: { 'index.js': 'module.exports = 1;\n' },
		} );

		expect(
			findPackageDir( {
				rootDir,
				packageName: 'left-pad',
				version: '1.3.0',
			} )
		).toBe( entry );
	} );

	test( 'finds a scoped package nested under its scope directory', () => {
		const rootDir = createRepository();
		const entry = installLinked( rootDir, {
			name: '@scope/thing',
			version: '2.0.1',
			files: { 'index.js': 'module.exports = 2;\n' },
		} );

		expect(
			findPackageDir( {
				rootDir,
				packageName: '@scope/thing',
				version: '2.0.1',
			} )
		).toBe( entry );
	} );

	test( 'resolves a workspace symlink to its real store directory', () => {
		const rootDir = createRepository( { workspaces: [ 'packages/*' ] } );
		const entry = installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0',
			files: { 'index.js': 'module.exports = 1;\n' },
			consumer: 'packages/block-editor',
		} );

		expect( findPackageDir( { rootDir, packageName: 'left-pad' } ) ).toBe(
			entry
		);
	} );

	test( 'ignores an installed copy whose version does not match', () => {
		const rootDir = createRepository();
		installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0',
			files: { 'index.js': 'module.exports = 1;\n' },
		} );

		expect(
			findPackageDir( {
				rootDir,
				packageName: 'left-pad',
				version: '9.9.9',
			} )
		).toBeNull();
	} );

	test( 'returns null when the package is absent', () => {
		const rootDir = createRepository();

		expect(
			findPackageDir( { rootDir, packageName: 'left-pad' } )
		).toBeNull();
	} );
} );

describe( 'retargetPatch', () => {
	test( 'rewrites both sides onto the real package location', () => {
		const patch = [
			'diff --git a/node_modules/@scope/thing/index.js b/node_modules/@scope/thing/index.js',
			'--- a/node_modules/@scope/thing/index.js',
			'+++ b/node_modules/@scope/thing/index.js',
		].join( '\n' );

		const result = retargetPatch(
			patch,
			'@scope/thing',
			'node_modules/.store/@scope/thing@2.0.1-hash/node_modules/@scope/thing'
		);

		expect( result ).not.toContain(
			'a/node_modules/@scope/thing/index.js'
		);
		expect( result ).toContain(
			'a/node_modules/.store/@scope/thing@2.0.1-hash/node_modules/@scope/thing/index.js'
		);
	} );
} );

describe( 'applyPatches', () => {
	const patchBody = [
		'diff --git a/node_modules/left-pad/index.js b/node_modules/left-pad/index.js',
		'--- a/node_modules/left-pad/index.js',
		'+++ b/node_modules/left-pad/index.js',
		'@@ -1 +1 @@',
		'-module.exports = 1;',
		'+module.exports = 2;',
		'',
	].join( '\n' );

	function seed() {
		const rootDir = createRepository();
		const entry = installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0',
			files: { 'index.js': 'module.exports = 1;\n' },
		} );
		fs.writeFileSync(
			path.join( rootDir, 'patches/left-pad+1.3.0.patch' ),
			patchBody
		);
		return { rootDir, entry };
	}

	test( 'applies a patch to a package inside the store', () => {
		const { rootDir, entry } = seed();

		const result = applyPatches( { rootDir, log: silentLog } );

		expect( result ).toMatchObject( { applied: 1, failed: 0 } );
		expect(
			fs.readFileSync( path.join( entry, 'index.js' ), 'utf8' )
		).toBe( 'module.exports = 2;\n' );
	} );

	test( 'is idempotent across repeat runs', () => {
		const { rootDir, entry } = seed();

		applyPatches( { rootDir, log: silentLog } );
		const second = applyPatches( { rootDir, log: silentLog } );

		expect( second ).toMatchObject( { applied: 0, skipped: 1, failed: 0 } );
		expect(
			fs.readFileSync( path.join( entry, 'index.js' ), 'utf8' )
		).toBe( 'module.exports = 2;\n' );
	} );

	test( 'reports a failure when the package is not installed', () => {
		const rootDir = createRepository();
		fs.writeFileSync(
			path.join( rootDir, 'patches/left-pad+1.3.0.patch' ),
			patchBody
		);

		expect( applyPatches( { rootDir, log: silentLog } ) ).toMatchObject( {
			applied: 0,
			failed: 1,
		} );
	} );

	test( 'reports a failure when the patch does not apply cleanly', () => {
		const { rootDir, entry } = seed();
		fs.writeFileSync(
			path.join( entry, 'index.js' ),
			'module.exports = 999;\n'
		);

		expect( applyPatches( { rootDir, log: silentLog } ) ).toMatchObject( {
			failed: 1,
		} );
	} );
} );

describe( 'createPatch', () => {
	function fetchPristine( files ) {
		return ( name, version, destination ) => {
			const dir = path.join( destination, 'package' );
			writeJson( path.join( dir, 'package.json' ), { name, version } );
			for ( const [ relative, contents ] of Object.entries( files ) ) {
				fs.writeFileSync( path.join( dir, relative ), contents );
			}
			return dir;
		};
	}

	test( 'writes a patch that applyPatches can consume', () => {
		const rootDir = createRepository();
		const entry = installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0',
			files: { 'index.js': 'module.exports = 2;\n' },
		} );

		const { patchPath, written } = createPatch( {
			rootDir,
			packageName: 'left-pad',
			fetchPristine: fetchPristine( {
				'index.js': 'module.exports = 1;\n',
			} ),
			log: silentLog,
		} );

		expect( written ).toBe( true );
		expect( path.basename( patchPath ) ).toBe( 'left-pad+1.3.0.patch' );

		const contents = fs.readFileSync( patchPath, 'utf8' );
		expect( contents ).toContain( 'a/node_modules/left-pad/index.js' );
		expect( contents ).toContain( '+module.exports = 2;' );

		// Reset to pristine so the freshly written patch has something to do.
		fs.writeFileSync(
			path.join( entry, 'index.js' ),
			'module.exports = 1;\n'
		);

		expect( applyPatches( { rootDir, log: silentLog } ) ).toMatchObject( {
			applied: 1,
			failed: 0,
		} );
		expect(
			fs.readFileSync( path.join( entry, 'index.js' ), 'utf8' )
		).toBe( 'module.exports = 2;\n' );
	} );

	test( 'names a scoped patch with the scope separator encoded', () => {
		const rootDir = createRepository();
		installLinked( rootDir, {
			name: '@scope/thing',
			version: '2.0.1',
			files: { 'index.js': 'module.exports = 2;\n' },
		} );

		const { patchPath } = createPatch( {
			rootDir,
			packageName: '@scope/thing',
			fetchPristine: fetchPristine( {
				'index.js': 'module.exports = 1;\n',
			} ),
			log: silentLog,
		} );

		expect( path.basename( patchPath ) ).toBe( '@scope+thing+2.0.1.patch' );
	} );

	test( 'excludes the package’s own node_modules from the diff', () => {
		const rootDir = createRepository();
		const entry = installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0',
			files: {
				'index.js': 'module.exports = 2;\n',
				'node_modules/dep/index.js': 'module.exports = "dep";\n',
			},
		} );
		// A symlinked sibling is what stops patch-package from diffing at all.
		fs.symlinkSync(
			entry,
			path.join( entry, 'node_modules', 'self-link' )
		);

		const { patchPath } = createPatch( {
			rootDir,
			packageName: 'left-pad',
			fetchPristine: fetchPristine( {
				'index.js': 'module.exports = 1;\n',
			} ),
			log: silentLog,
		} );

		expect( fs.readFileSync( patchPath, 'utf8' ) ).not.toContain(
			'node_modules/dep'
		);
	} );

	test( 'removes an existing patch when the package matches the tarball', () => {
		const rootDir = createRepository();
		installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0',
			files: { 'index.js': 'module.exports = 1;\n' },
		} );
		const stale = path.join( rootDir, 'patches/left-pad+1.3.0.patch' );
		fs.writeFileSync( stale, 'stale\n' );

		const { written } = createPatch( {
			rootDir,
			packageName: 'left-pad',
			fetchPristine: fetchPristine( {
				'index.js': 'module.exports = 1;\n',
			} ),
			log: silentLog,
		} );

		expect( written ).toBe( false );
		expect( fs.existsSync( stale ) ).toBe( false );
	} );

	test( 'throws when the package is not installed', () => {
		const rootDir = createRepository();

		expect( () =>
			createPatch( {
				rootDir,
				packageName: 'left-pad',
				fetchPristine: fetchPristine( {} ),
				log: silentLog,
			} )
		).toThrow( /not installed/ );
	} );
} );

describe( 'regression coverage from review', () => {
	test( 'parses a version carrying numeric build metadata', () => {
		expect( parsePatchFileName( 'pkg+1.2.3+4.5.6.patch' ) ).toEqual( {
			packageName: 'pkg',
			version: '1.2.3+4.5.6',
		} );
	} );

	test( 'does not mistake a prerelease for the exact stable version', () => {
		const rootDir = createRepository();
		installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0-beta.1',
			files: { 'index.js': 'module.exports = 0;\n' },
			hash: 'beta',
		} );

		expect(
			findPackageDir( {
				rootDir,
				packageName: 'left-pad',
				version: '1.3.0',
			} )
		).toBeNull();
	} );

	test( 'finds every store copy of the same name and version', () => {
		const rootDir = createRepository();
		const first = installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0',
			files: { 'index.js': 'module.exports = 1;\n' },
			hash: 'aaa',
		} );
		const second = installLinked( rootDir, {
			name: 'left-pad',
			version: '1.3.0',
			files: { 'index.js': 'module.exports = 1;\n' },
			hash: 'bbb',
		} );

		const found = findPackageDirs( {
			rootDir,
			packageName: 'left-pad',
			version: '1.3.0',
		} );

		expect( found.sort() ).toEqual( [ first, second ].sort() );
	} );

	test( 'patches every store copy, not just the first', () => {
		const rootDir = createRepository();
		const copies = [ 'aaa', 'bbb' ].map( ( hash ) =>
			installLinked( rootDir, {
				name: 'left-pad',
				version: '1.3.0',
				files: { 'index.js': 'module.exports = 1;\n' },
				hash,
			} )
		);
		fs.writeFileSync(
			path.join( rootDir, 'patches/left-pad+1.3.0.patch' ),
			[
				'diff --git a/node_modules/left-pad/index.js b/node_modules/left-pad/index.js',
				'--- a/node_modules/left-pad/index.js',
				'+++ b/node_modules/left-pad/index.js',
				'@@ -1 +1 @@',
				'-module.exports = 1;',
				'+module.exports = 2;',
				'',
			].join( '\n' )
		);

		expect( applyPatches( { rootDir, log: silentLog } ) ).toMatchObject( {
			applied: 2,
			failed: 0,
		} );
		for ( const copy of copies ) {
			expect(
				fs.readFileSync( path.join( copy, 'index.js' ), 'utf8' )
			).toBe( 'module.exports = 2;\n' );
		}
	} );

	test( 'leaves hunk payloads that look like paths untouched', () => {
		const patch = [
			'diff --git a/node_modules/foo/i.js b/node_modules/foo/i.js',
			'--- a/node_modules/foo/i.js',
			'+++ b/node_modules/foo/i.js',
			'@@ -1 +1 @@',
			'-const p = "a/node_modules/foo/keep";',
			'+const p = "b/node_modules/foo/keep";',
		].join( '\n' );

		const result = retargetPatch(
			patch,
			'foo',
			'node_modules/.store/foo@1.0.0-h/node_modules/foo'
		);

		expect( result ).toContain( '-const p = "a/node_modules/foo/keep";' );
		expect( result ).toContain( '+const p = "b/node_modules/foo/keep";' );
		expect( result ).toContain(
			'--- a/node_modules/.store/foo@1.0.0-h/node_modules/foo/i.js'
		);
	} );

	test( 'retargets rename headers', () => {
		const patch = [
			'diff --git a/node_modules/foo/old.js b/node_modules/foo/new.js',
			'rename from node_modules/foo/old.js',
			'rename to node_modules/foo/new.js',
		].join( '\n' );

		const result = retargetPatch( patch, 'foo', 'vendor/foo' );

		expect( result ).toContain( 'rename from vendor/foo/old.js' );
		expect( result ).toContain( 'rename to vendor/foo/new.js' );
	} );

	test( 'fails rather than silently skipping an unparseable filename', () => {
		const rootDir = createRepository();
		fs.writeFileSync(
			path.join( rootDir, 'patches/not-a-valid-name.patch' ),
			'noop\n'
		);

		expect( applyPatches( { rootDir, log: silentLog } ) ).toMatchObject( {
			failed: 1,
		} );
	} );
} );

describe( 'main', () => {
	test( 'defaults to apply and succeeds with nothing to do', () => {
		const rootDir = createRepository();

		expect( main( [], { rootDir, log: silentLog } ) ).toBe( 0 );
	} );

	test( 'prints usage for --help', () => {
		const rootDir = createRepository();
		const lines = [];

		expect(
			main( [ '--help' ], {
				rootDir,
				log: { ...silentLog, log: ( line ) => lines.push( line ) },
			} )
		).toBe( 0 );
		expect( lines.join( '\n' ) ).toContain( 'Usage:' );
	} );

	test( 'rejects an unknown option instead of reading it as a package', () => {
		const rootDir = createRepository();

		expect(
			main( [ 'create', '--oops' ], { rootDir, log: silentLog } )
		).toBe( 1 );
	} );

	test( 'rejects arguments passed to apply', () => {
		const rootDir = createRepository();

		expect(
			main( [ 'apply', 'left-pad' ], { rootDir, log: silentLog } )
		).toBe( 1 );
	} );

	test( 'rejects more than one package for create', () => {
		const rootDir = createRepository();

		expect(
			main( [ 'create', 'a', 'b' ], { rootDir, log: silentLog } )
		).toBe( 1 );
	} );

	test( 'requires a package name for create', () => {
		const rootDir = createRepository();

		expect( main( [ 'create' ], { rootDir, log: silentLog } ) ).toBe( 1 );
	} );

	test( 'rejects an unknown command', () => {
		const rootDir = createRepository();

		expect( main( [ 'frobnicate' ], { rootDir, log: silentLog } ) ).toBe(
			1
		);
	} );

	test( 'exits non-zero when a patch fails to apply', () => {
		const rootDir = createRepository();
		fs.writeFileSync(
			path.join( rootDir, 'patches/left-pad+1.3.0.patch' ),
			'noop\n'
		);

		expect( main( [ 'apply' ], { rootDir, log: silentLog } ) ).toBe( 1 );
	} );
} );
