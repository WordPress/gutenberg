/**
 * Internal dependencies
 */
import { findTransferables } from '../transferables';

describe( 'transferables', () => {
	describe( 'findTransferables', () => {
		describe( 'primitive values', () => {
			it( 'should return empty array for null', () => {
				expect( findTransferables( null ) ).toEqual( [] );
			} );

			it( 'should return empty array for undefined', () => {
				expect( findTransferables( undefined ) ).toEqual( [] );
			} );

			it( 'should return empty array for string', () => {
				expect( findTransferables( 'hello' ) ).toEqual( [] );
			} );

			it( 'should return empty array for number', () => {
				expect( findTransferables( 42 ) ).toEqual( [] );
			} );

			it( 'should return empty array for boolean', () => {
				expect( findTransferables( true ) ).toEqual( [] );
			} );

			it( 'should return empty array for function', () => {
				expect( findTransferables( () => {} ) ).toEqual( [] );
			} );
		} );

		describe( 'ArrayBuffer', () => {
			it( 'should detect ArrayBuffer', () => {
				const buffer = new ArrayBuffer( 8 );
				const result = findTransferables( buffer );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should handle empty ArrayBuffer', () => {
				const buffer = new ArrayBuffer( 0 );
				const result = findTransferables( buffer );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should not add duplicate ArrayBuffers', () => {
				const buffer = new ArrayBuffer( 8 );
				const obj = { a: buffer, b: buffer };
				const result = findTransferables( obj );

				expect( result ).toHaveLength( 1 );
			} );
		} );

		describe( 'TypedArrays', () => {
			it( 'should extract buffer from Uint8Array', () => {
				const typedArray = new Uint8Array( 8 );
				const result = findTransferables( typedArray );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should extract buffer from Int32Array', () => {
				const typedArray = new Int32Array( 4 );
				const result = findTransferables( typedArray );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should extract buffer from Float64Array', () => {
				const typedArray = new Float64Array( 2 );
				const result = findTransferables( typedArray );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should not duplicate buffer for multiple TypedArrays sharing same buffer', () => {
				const buffer = new ArrayBuffer( 16 );
				const view1 = new Uint8Array( buffer, 0, 8 );
				const view2 = new Uint8Array( buffer, 8, 8 );
				const result = findTransferables( { view1, view2 } );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );
		} );

		describe( 'arrays', () => {
			it( 'should find transferables in arrays', () => {
				const buffer = new ArrayBuffer( 8 );
				const result = findTransferables( [ buffer ] );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should find transferables in nested arrays', () => {
				const buffer = new ArrayBuffer( 8 );
				const result = findTransferables( [ [ [ buffer ] ] ] );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should handle empty arrays', () => {
				expect( findTransferables( [] ) ).toEqual( [] );
			} );

			it( 'should find multiple transferables in arrays', () => {
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
		} );

		describe( 'objects', () => {
			it( 'should find transferables in objects', () => {
				const buffer = new ArrayBuffer( 8 );
				const result = findTransferables( { data: buffer } );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should find transferables in nested objects', () => {
				const buffer = new ArrayBuffer( 8 );
				const result = findTransferables( {
					level1: { level2: { data: buffer } },
				} );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should handle empty objects', () => {
				expect( findTransferables( {} ) ).toEqual( [] );
			} );

			it( 'should find multiple transferables in objects', () => {
				const buffer1 = new ArrayBuffer( 8 );
				const buffer2 = new ArrayBuffer( 16 );
				const result = findTransferables( {
					first: buffer1,
					second: buffer2,
				} );

				expect( result ).toHaveLength( 2 );
				expect( result ).toContain( buffer1 );
				expect( result ).toContain( buffer2 );
			} );
		} );

		describe( 'circular references', () => {
			it( 'should handle circular object references', () => {
				const obj: Record< string, unknown > = {
					buffer: new ArrayBuffer( 8 ),
				};
				obj.self = obj;

				const result = findTransferables( obj );

				expect( result ).toHaveLength( 1 );
			} );

			it( 'should handle circular array references', () => {
				const arr: unknown[] = [ new ArrayBuffer( 8 ) ];
				arr.push( arr );

				const result = findTransferables( arr );

				expect( result ).toHaveLength( 1 );
			} );

			it( 'should visit objects only once when multiple paths exist', () => {
				const sharedObj = { buffer: new ArrayBuffer( 8 ) };
				const obj = { a: sharedObj, b: sharedObj };

				const result = findTransferables( obj );

				// Should only find the buffer once
				expect( result ).toHaveLength( 1 );
			} );
		} );

		describe( 'complex structures', () => {
			it( 'should handle mixed arrays and objects', () => {
				const buffer1 = new ArrayBuffer( 8 );
				const buffer2 = new ArrayBuffer( 16 );
				const complex = {
					items: [ { data: buffer1 }, 'text' ],
					nested: {
						arr: [ buffer2, null, undefined ],
					},
				};

				const result = findTransferables( complex );

				expect( result ).toHaveLength( 2 );
				expect( result ).toContain( buffer1 );
				expect( result ).toContain( buffer2 );
			} );

			it( 'should handle RPC message structure with ArrayBuffer args', () => {
				const buffer = new ArrayBuffer( 1024 );
				const message = {
					type: 1,
					id: 42,
					method: 'processData',
					args: [ buffer, 'option1', { quality: 0.8 } ],
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should handle RPC message structure with TypedArray args', () => {
				const typedArray = new Uint8Array( [ 1, 2, 3, 4 ] );
				const message = {
					type: 1,
					id: 42,
					method: 'processData',
					args: [ typedArray ],
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );
		} );
	} );
} );
