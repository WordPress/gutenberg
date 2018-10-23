/**
 * Internal dependencies
 */
import { getMutateSafeObject, diff, merge } from '../object';

describe( 'object', () => {
	describe( 'getMutateSafeObject', () => {
		let original;
		beforeEach( () => {
			// Verify cloned by mutating a frozen object.
			original = Object.freeze( { a: 1 } );
		} );

		it( 'creates a mutable clone if working with original', () => {
			let working = original;

			working = getMutateSafeObject( original, working );
			working.b = 2;

			expect( working ).not.toBe( original );
			expect( working ).toEqual( { a: 1, b: 2 } );
		} );

		it( 'creates returns identity if working with cloned', () => {
			let working = getMutateSafeObject( original, original );

			for ( let i = 0; i < 2; i++ ) {
				const pendingWorking = getMutateSafeObject( original, working );
				expect( pendingWorking ).toBe( working );
				working = pendingWorking;
			}
		} );
	} );

	describe( 'diff', () => {
		it( 'should return RHS reference if result would be same as RHS', () => {
			const lhs = {};
			const rhs = { a: { b: { c: 1 } } };
			const result = diff( lhs, rhs );

			expect( result ).toBe( rhs );
		} );

		it( 'should omit deeply equal property values', () => {
			const lhs = { a: { b: { c: 1 } } };
			const rhs = { a: { b: { c: 1 } } };
			const result = diff( lhs, rhs );

			expect( result ).not.toBe( rhs );
			expect( result ).toEqual( {} );
		} );

		it( 'should return minimal object difference', () => {
			const lhs = { a: { b: { c: 1 } } };
			const rhs = { a: { b: { c: 1, d: 2 } } };
			const result = diff( lhs, rhs );

			expect( result ).not.toBe( rhs );
			expect( result ).toEqual( { a: { b: { d: 2 } } } );
		} );
	} );

	describe( 'merge', () => {
		it( 'should return equal reference if same, deeply', () => {
			const obj1 = { a: { b: { c: 1 } } };
			const obj2 = { a: { b: { c: 1 } } };
			const result = merge( obj1, obj2 );

			expect( result ).toBe( obj1 );
		} );

		it( 'should deeply merged object', () => {
			const obj1 = { a: { b: { c: 1 } } };
			const obj2 = { a: { b: { d: 2 } } };
			const result = merge( obj1, obj2 );

			expect( result ).not.toBe( obj1 );
			expect( result ).toEqual( { a: { b: { c: 1, d: 2 } } } );
		} );
	} );
} );
