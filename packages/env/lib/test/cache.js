import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const {
	didCacheChange,
	setCache,
	getCache,
	getCacheFile,
} = require( '../cache' );

const cacheOptions = {};
let tempDirectoryPath;

function getCacheFilePath() {
	return path.join( cacheOptions.workDirectoryPath, 'wp-env-cache.json' );
}

function deleteCacheFile() {
	fs.rmSync( getCacheFilePath(), { force: true } );
}

function setCacheFile( data ) {
	fs.writeFileSync( getCacheFilePath(), JSON.stringify( data ) );
}

describe( 'cache file', () => {
	beforeEach( () => {
		tempDirectoryPath = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wp-env-cache-' )
		);
		cacheOptions.workDirectoryPath = tempDirectoryPath;
	} );

	afterEach( () => {
		fs.rmSync( tempDirectoryPath, {
			recursive: true,
			force: true,
		} );
	} );

	describe( 'didCacheChange', () => {
		it( 'returns true if the existing cache value is different', async () => {
			setCacheFile( { test: 'test1' } );
			const result = await didCacheChange( 'test', 'nope', cacheOptions );
			expect( result ).toBe( true );
		} );
		it( 'returns false if the existing cache value is the same', async () => {
			setCacheFile( { test: 'test1' } );
			const result = await didCacheChange(
				'test',
				'test1',
				cacheOptions
			);
			expect( result ).toBe( false );
		} );
		it( 'returns true if the existing cache value does not exist', async () => {
			expect.assertions( 2 );

			setCacheFile( { howdy: 'test1' } );
			const result = await didCacheChange( 'test', 'nope', cacheOptions );
			expect( result ).toBe( true );

			deleteCacheFile();
			const result2 = await didCacheChange(
				'test',
				'nope',
				cacheOptions
			);
			expect( result2 ).toBe( true );
		} );
	} );

	describe( 'setCache', () => {
		it( 'saves a new cache value to the file', async () => {
			await setCache( 'test', 'abc', cacheOptions );
			const result = await getCacheFile( cacheOptions );
			expect( result ).toEqual( { test: 'abc' } );
		} );
		it( 'overwrites an existing key', async () => {
			expect.assertions( 2 );
			setCacheFile( { test: 'abc' } );
			const result = await getCacheFile( cacheOptions );
			expect( result ).toEqual( { test: 'abc' } );

			await setCache( 'test', '123', cacheOptions );
			const result2 = await getCacheFile( cacheOptions );
			expect( result2 ).toEqual( { test: '123' } );
		} );
		it( 'does not overwrite other keys', async () => {
			setCacheFile( { test: 'abc' } );

			await setCache( 'test2', 1234, cacheOptions );
			const result = await getCacheFile( cacheOptions );
			expect( result ).toEqual( { test: 'abc', test2: 1234 } );
		} );
		it( 'does not change what a parallel reader of the file sees', async () => {
			setCacheFile( { test: 'abc' } );
			const reader = await fs.promises.open( getCacheFilePath(), 'r' );

			await setCache( 'test2', 1234, cacheOptions );
			const seen = await reader.readFile( 'utf8' );
			await reader.close();

			expect( JSON.parse( seen ) ).toEqual( { test: 'abc' } );
			expect( fs.readdirSync( cacheOptions.workDirectoryPath ) ).toEqual(
				[ 'wp-env-cache.json' ]
			);
		} );
		it( 'does not rewrite the file if the value is unchanged', async () => {
			setCacheFile( { test: 'abc', ports: { development: 8888 } } );
			const { ino } = fs.statSync( getCacheFilePath() );

			await setCache( 'test', 'abc', cacheOptions );
			await setCache( 'ports', { development: 8888 }, cacheOptions );

			expect( fs.statSync( getCacheFilePath() ).ino ).toBe( ino );
		} );
		it( 'writes the file directly if it cannot be replaced', async () => {
			setCacheFile( { test: 'abc' } );
			const rename = vi
				.spyOn( fs.promises, 'rename' )
				.mockRejectedValue( { code: 'EPERM' } );

			await setCache( 'test2', 1234, cacheOptions );
			rename.mockRestore();

			const result = await getCacheFile( cacheOptions );
			expect( result ).toEqual( { test: 'abc', test2: 1234 } );
			expect( fs.readdirSync( cacheOptions.workDirectoryPath ) ).toEqual(
				[ 'wp-env-cache.json' ]
			);
		} );
	} );

	describe( 'getCache', () => {
		it( 'returns the cache value associated with the key', async () => {
			const value = 'test1';
			setCacheFile( { test: value } );
			const result = await getCache( 'test', cacheOptions );
			expect( result ).toBe( value );
		} );
		it( 'returns undefined if there is no existing value', async () => {
			setCacheFile( { anotherValue: 'hello' } );
			const result = await getCache( 'test', cacheOptions );
			expect( result ).toBe( undefined );
		} );
		it( 'returns undefined if the file does not exist', async () => {
			deleteCacheFile();
			const result = await getCache( 'test', cacheOptions );
			expect( result ).toBe( undefined );
		} );
	} );

	describe( 'getCacheFile', () => {
		it( 'returns the stored JSON data as an Object', async () => {
			const testData = {
				a: 'test',
				b: 1,
				c: true,
				d: null,
				e: {
					foo: 'test2',
				},
			};
			setCacheFile( testData );

			const result = await getCacheFile( cacheOptions );
			expect( result ).toEqual( testData );
		} );
		it( 'returns an empty object if the file does not exist', async () => {
			deleteCacheFile();
			const result = await getCacheFile( cacheOptions );
			expect( result ).toEqual( {} );
		} );
		it( 'returns an empty object if the file is invalid', async () => {
			fs.writeFileSync( getCacheFilePath(), '{' );
			const result = await getCacheFile( cacheOptions );
			expect( result ).toEqual( {} );
		} );
	} );
} );
