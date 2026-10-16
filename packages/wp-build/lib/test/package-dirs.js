import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PACKAGE_DIRS, getPackageDirs } from '../package-dirs.mjs';

describe( 'getPackageDirs()', () => {
	let rootDir;

	const addPackage = ( relativeDir ) => {
		const dir = path.join( rootDir, relativeDir );
		mkdirSync( dir, { recursive: true } );
		writeFileSync( path.join( dir, 'package.json' ), '{}' );
	};

	beforeEach( () => {
		rootDir = mkdtempSync(
			path.join( os.tmpdir(), 'wordpress-build-package-dirs-' )
		);
	} );

	afterEach( () => {
		rmSync( rootDir, { force: true, recursive: true } );
	} );

	it( 'finds the packages in packages/ by default', () => {
		addPackage( 'packages/b' );
		addPackage( 'packages/a' );
		// A folder without a package.json is not a package.
		mkdirSync( path.join( rootDir, 'packages', 'not-a-package' ) );

		expect( DEFAULT_PACKAGE_DIRS ).toEqual( [ 'packages' ] );
		expect( getPackageDirs( rootDir ) ).toEqual(
			new Map( [
				[ 'a', path.join( rootDir, 'packages', 'a' ) ],
				[ 'b', path.join( rootDir, 'packages', 'b' ) ],
			] )
		);
	} );

	it( 'accepts folders of packages and package folders', () => {
		addPackage( 'packages/a' );
		addPackage( 'modules/b' );
		addPackage( 'standalone' );

		expect(
			getPackageDirs( rootDir, [ 'packages', 'modules', 'standalone' ] )
		).toEqual(
			new Map( [
				[ 'a', path.join( rootDir, 'packages', 'a' ) ],
				[ 'b', path.join( rootDir, 'modules', 'b' ) ],
				[ 'standalone', path.join( rootDir, 'standalone' ) ],
			] )
		);
	} );

	it( 'ignores an entry listed twice', () => {
		addPackage( 'packages/a' );

		expect(
			getPackageDirs( rootDir, [ 'packages', './packages' ] )
		).toEqual(
			new Map( [ [ 'a', path.join( rootDir, 'packages', 'a' ) ] ] )
		);
	} );

	it( 'throws when two packages share a folder name', () => {
		addPackage( 'packages/a' );
		addPackage( 'a' );

		expect( () => getPackageDirs( rootDir, [ 'packages', 'a' ] ) ).toThrow(
			'Two packages share the folder name "a"'
		);
	} );

	it( 'throws when an entry is not a folder', () => {
		expect( () => getPackageDirs( rootDir, [ 'missing' ] ) ).toThrow(
			'`wpPlugin.packageDirs` lists "missing", which is not a folder.'
		);
	} );

	it( 'throws when the option is not an array of strings', () => {
		expect( () => getPackageDirs( rootDir, 'packages' ) ).toThrow(
			'must be an array of folder paths'
		);
		expect( () => getPackageDirs( rootDir, [ 1 ] ) ).toThrow(
			'must be an array of folder paths'
		);
	} );
} );
