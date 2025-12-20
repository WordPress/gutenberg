'use strict';
/**
 * External dependencies
 */
const { readFile, writeFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const {
	didCacheChange,
	setCache,
	getCache,
	getCacheFile,
} = require( '../cache' );

jest.mock( 'fs', () => ( {
	promises: {
		readFile: jest.fn(),
		writeFile: jest.fn(),
		mkdir: jest.fn(),
	},
} ) );

const cacheOptions = {
	workDirectoryPath: '/a/b/c',
};

function deleteCacheFile() {
	readFile.mockImplementation( () => Promise.reject( 'No file!' ) );
}

function setCacheFile( data ) {
	readFile.mockImplementation( () =>
		Promise.resolve( JSON.stringify( data ) )
	);
}

function setupWriteFile() {
	writeFile.mockImplementation( ( fileName, data ) => {
		readFile.mockClear();
		readFile.mockImplementation( () => Promise.resolve( data ) );
	} );
}

describe( 'cache file', () => {
	beforeEach( () => {
		jest.clearAllMocks();
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
			setupWriteFile();
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
			readFile.mockImplementation( () => Promise.resolve( '{' ) );
			const result = await getCacheFile( cacheOptions );
			expect( result ).toEqual( {} );
		} );
	} );
} );
