/**
 * Internal dependencies
 */
import { findTransferables } from '../transferables';

describe( 'transferables', () => {
	describe( 'findTransferables', () => {
		describe( 'non-array values', () => {
			it( 'should return empty array for null', () => {
				expect( findTransferables( null ) ).toEqual( [] );
			} );

			it( 'should return empty array for undefined', () => {
				expect( findTransferables( undefined ) ).toEqual( [] );
			} );

			it( 'should return empty array for primitives', () => {
				expect( findTransferables( 'hello' ) ).toEqual( [] );
				expect( findTransferables( 42 ) ).toEqual( [] );
				expect( findTransferables( true ) ).toEqual( [] );
			} );

			it( 'should return empty array for objects', () => {
				expect( findTransferables( {} ) ).toEqual( [] );
			} );
		} );

		describe( 'arrays with transferables', () => {
			it( 'should find ArrayBuffer in array', () => {
				const buffer = new ArrayBuffer( 8 );
				const result = findTransferables( [ buffer ] );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should find TypedArray buffer in array', () => {
				const typedArray = new Uint8Array( [ 1, 2, 3, 4 ] );
				const result = findTransferables( [ typedArray ] );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should find multiple transferables in array', () => {
				const buffer1 = new ArrayBuffer( 8 );
				const buffer2 = new ArrayBuffer( 16 );
				const result = findTransferables( [
					buffer1,
					'string',
					buffer2,
				] );

				expect( result ).toHaveLength( 2 );
				expect( result ).toContain( buffer1 );
				expect( result ).toContain( buffer2 );
			} );

			it( 'should not duplicate same buffer in array', () => {
				const buffer = new ArrayBuffer( 8 );
				const result = findTransferables( [ buffer, buffer ] );

				expect( result ).toHaveLength( 1 );
			} );

			it( 'should handle empty array', () => {
				expect( findTransferables( [] ) ).toEqual( [] );
			} );

			it( 'should not find nested transferables', () => {
				const buffer = new ArrayBuffer( 8 );
				const result = findTransferables( [ { nested: buffer } ] );

				expect( result ).toHaveLength( 0 );
			} );
		} );

		describe( 'TypedArray varieties', () => {
			it( 'should extract buffer from Int32Array', () => {
				const typedArray = new Int32Array( 4 );
				const result = findTransferables( [ typedArray ] );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should extract buffer from Float64Array', () => {
				const typedArray = new Float64Array( 2 );
				const result = findTransferables( [ typedArray ] );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should not duplicate buffer for TypedArrays sharing same buffer', () => {
				const buffer = new ArrayBuffer( 16 );
				const view1 = new Uint8Array( buffer, 0, 8 );
				const view2 = new Uint8Array( buffer, 8, 8 );
				const result = findTransferables( [ view1, view2 ] );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );
		} );
	} );
} );
