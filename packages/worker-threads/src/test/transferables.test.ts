/**
 * Internal dependencies
 */
import { findTransferables } from '../transferables';

describe( 'transferables', () => {
	describe( 'findTransferables', () => {
		describe( 'non-message values', () => {
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

			it( 'should return empty array for empty objects', () => {
				expect( findTransferables( {} ) ).toEqual( [] );
			} );
		} );

		describe( 'CALL messages with args', () => {
			it( 'should find ArrayBuffer in args', () => {
				const buffer = new ArrayBuffer( 8 );
				const message = {
					type: 1,
					id: 1,
					method: 'test',
					args: [ buffer ],
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should find TypedArray buffer in args', () => {
				const typedArray = new Uint8Array( [ 1, 2, 3, 4 ] );
				const message = {
					type: 1,
					id: 1,
					method: 'test',
					args: [ typedArray ],
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should find multiple transferables in args', () => {
				const buffer1 = new ArrayBuffer( 8 );
				const buffer2 = new ArrayBuffer( 16 );
				const message = {
					type: 1,
					id: 1,
					method: 'test',
					args: [ buffer1, 'string', buffer2 ],
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 2 );
				expect( result ).toContain( buffer1 );
				expect( result ).toContain( buffer2 );
			} );

			it( 'should not duplicate same buffer in args', () => {
				const buffer = new ArrayBuffer( 8 );
				const message = {
					type: 1,
					id: 1,
					method: 'test',
					args: [ buffer, buffer ],
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
			} );

			it( 'should handle empty args array', () => {
				const message = {
					type: 1,
					id: 1,
					method: 'test',
					args: [],
				};

				expect( findTransferables( message ) ).toEqual( [] );
			} );

			it( 'should not find nested transferables in args', () => {
				const buffer = new ArrayBuffer( 8 );
				const message = {
					type: 1,
					id: 1,
					method: 'test',
					args: [ { nested: buffer } ],
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 0 );
			} );
		} );

		describe( 'RESULT messages with result', () => {
			it( 'should find ArrayBuffer in result', () => {
				const buffer = new ArrayBuffer( 8 );
				const message = {
					type: 2,
					id: 1,
					result: buffer,
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );

			it( 'should find TypedArray buffer in result', () => {
				const typedArray = new Uint8Array( 8 );
				const message = {
					type: 2,
					id: 1,
					result: typedArray,
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should handle null result', () => {
				const message = {
					type: 2,
					id: 1,
					result: null,
				};

				expect( findTransferables( message ) ).toEqual( [] );
			} );

			it( 'should handle undefined result', () => {
				const message = {
					type: 2,
					id: 1,
					result: undefined,
				};

				expect( findTransferables( message ) ).toEqual( [] );
			} );

			it( 'should not find nested transferables in result', () => {
				const buffer = new ArrayBuffer( 8 );
				const message = {
					type: 2,
					id: 1,
					result: { data: buffer },
				};

				const result = findTransferables( message );

				expect( result ).toHaveLength( 0 );
			} );
		} );

		describe( 'TypedArray varieties', () => {
			it( 'should extract buffer from Int32Array', () => {
				const typedArray = new Int32Array( 4 );
				const message = { args: [ typedArray ] };

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should extract buffer from Float64Array', () => {
				const typedArray = new Float64Array( 2 );
				const message = { args: [ typedArray ] };

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( typedArray.buffer );
			} );

			it( 'should not duplicate buffer for TypedArrays sharing same buffer', () => {
				const buffer = new ArrayBuffer( 16 );
				const view1 = new Uint8Array( buffer, 0, 8 );
				const view2 = new Uint8Array( buffer, 8, 8 );
				const message = { args: [ view1, view2 ] };

				const result = findTransferables( message );

				expect( result ).toHaveLength( 1 );
				expect( result[ 0 ] ).toBe( buffer );
			} );
		} );
	} );
} );
