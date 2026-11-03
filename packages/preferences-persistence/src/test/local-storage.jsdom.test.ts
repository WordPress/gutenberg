import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStoredJSON, writeStoredJSON } from '../local-storage';

describe( 'local storage', () => {
	afterEach( () => {
		vi.restoreAllMocks();
		window.localStorage.clear();
	} );

	describe( 'readStoredJSON', () => {
		it( 'returns the parsed value', () => {
			window.localStorage.setItem( 'test', '{"a":1}' );
			expect( readStoredJSON( 'test' ) ).toEqual( { a: 1 } );
		} );

		it( 'returns null when the value is missing', () => {
			expect( readStoredJSON( 'test' ) ).toBeNull();
		} );

		it( 'returns null when the value is invalid JSON', () => {
			window.localStorage.setItem( 'test', '{' );
			expect( readStoredJSON( 'test' ) ).toBeNull();
		} );

		it( 'returns null when local storage is unavailable', () => {
			vi.spyOn( window, 'localStorage', 'get' ).mockImplementation(
				() => {
					throw new Error( 'SecurityError' );
				}
			);
			expect( readStoredJSON( 'test' ) ).toBeNull();
		} );
	} );

	describe( 'writeStoredJSON', () => {
		it( 'stores the value as JSON', () => {
			writeStoredJSON( 'test', { a: 1 } );
			expect( window.localStorage.getItem( 'test' ) ).toBe( '{"a":1}' );
		} );

		it( 'ignores errors from local storage', () => {
			vi.spyOn( global.Storage.prototype, 'setItem' ).mockImplementation(
				() => {
					throw new Error( 'QuotaExceededError' );
				}
			);
			expect( () => writeStoredJSON( 'test', { a: 1 } ) ).not.toThrow();
		} );
	} );
} );
