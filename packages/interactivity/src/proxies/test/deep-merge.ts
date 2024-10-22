/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * External dependencies
 */
import { effect } from '@preact/signals';
/**
 * Internal dependencies
 */
import { proxifyState, peek, deepMerge } from '../';
import { hasPropSignal } from '../state';
import { getProxyFromObject } from '../registry';

describe( 'Interactivity API', () => {
	describe( 'deepMerge', () => {
		it( 'should merge two plain objects', () => {
			const target = { a: 1, b: 2 };
			const source = { b: 3, c: 4 };
			const result = {};
			deepMerge( result, target );
			deepMerge( result, source );
			expect( result ).toEqual( { a: 1, b: 3, c: 4 } );
		} );

		it( 'should handle nested objects', () => {
			const target = { a: { x: 1 }, b: 2 };
			const source = { a: { y: 2 }, c: 3 };
			const result = {};
			deepMerge( result, target );
			deepMerge( result, source );
			expect( result ).toEqual( { a: { x: 1, y: 2 }, b: 2, c: 3 } );
		} );

		it( 'should not override existing properties when override is false', () => {
			const target = { a: 1, b: { x: 10 } };
			const source = { a: 2, b: { y: 20 }, c: 3 };
			const result = {};
			deepMerge( result, target );
			deepMerge( result, source, false );
			expect( result ).toEqual( { a: 1, b: { x: 10, y: 20 }, c: 3 } );
		} );

		it( 'should handle getters', () => {
			const target = {
				get a() {
					return 1;
				},
				b: 1,
			};
			const source = {
				a: 2,
				get b() {
					return 2;
				},
			};
			const result: Record< string, any > = {};
			deepMerge( result, target );
			deepMerge( result, source );
			expect( result.a ).toBe( 2 );
			expect( result.b ).toBe( 2 );
			expect(
				Object.getOwnPropertyDescriptor( result, 'a' )?.get
			).toBeUndefined();
			expect(
				Object.getOwnPropertyDescriptor( result, 'b' )?.get
			).toBeDefined();
		} );

		it( 'should not execute getters when performing the deep merge', () => {
			let targetExecuted = false;
			let sourceExecuted = false;
			const target = {
				get a() {
					targetExecuted = true;
					return 1;
				},
			};
			const source = {
				get b() {
					sourceExecuted = true;
					return 2;
				},
			};
			const result: Record< string, any > = {};
			deepMerge( result, target );
			deepMerge( result, source );
			expect( targetExecuted ).toBe( false );
			expect( sourceExecuted ).toBe( false );
		} );

		it( 'should handle setters', () => {
			let targetValue = 1;
			const target = {
				get a() {
					return targetValue;
				},
				set a( value ) {
					targetValue = value;
				},
				b: 1,
			};
			let sourceValue = 2;
			const source = {
				a: 3,
				get b() {
					return 2;
				},
				set b( value ) {
					sourceValue = value;
				},
			};

			const result: Record< string, any > = {};
			deepMerge( result, target );

			result.a = 5;
			expect( targetValue ).toBe( 5 );
			expect( result.a ).toBe( 5 );

			deepMerge( result, source );

			result.a = 6;
			expect( targetValue ).toBe( 5 );

			result.b = 7;
			expect( sourceValue ).toBe( 7 );

			expect( result.a ).toBe( 6 );
			expect( result.b ).toBe( 2 );
			expect(
				Object.getOwnPropertyDescriptor( result, 'a' )?.set
			).toBeUndefined();
			expect(
				Object.getOwnPropertyDescriptor( result, 'b' )?.set
			).toBeDefined();
		} );

		it( 'should handle setters when overwrite is false', () => {
			let targetValue = 1;
			const target = {
				get a() {
					return targetValue;
				},
				set a( value ) {
					targetValue = value;
				},
				b: 1,
			};
			let sourceValue = 2;
			const source = {
				a: 3,
				get b() {
					return 2;
				},
				set b( value ) {
					sourceValue = value;
				},
			};

			const result: Record< string, any > = {};
			deepMerge( result, target, false );
			deepMerge( result, source, false );

			result.a = 6;
			expect( targetValue ).toBe( 6 );

			result.b = 7;
			expect( sourceValue ).toBe( 2 );

			expect( result.a ).toBe( 6 );
			expect( result.b ).toBe( 7 );
			expect(
				Object.getOwnPropertyDescriptor( result, 'a' )?.set
			).toBeDefined();
			expect(
				Object.getOwnPropertyDescriptor( result, 'b' )?.set
			).toBeUndefined();
		} );

		it( 'should handle getters and setters together', () => {
			let targetValue = 1;
			const target = {
				get a() {
					return targetValue;
				},
				set a( value ) {
					targetValue = value;
				},
				b: 1,
			};
			let sourceValue = 2;
			const source = {
				get a() {
					return 3;
				},
				set a( value ) {
					sourceValue = value;
				},
			};
			const result: Record< string, any > = {};
			deepMerge( result, target );
			deepMerge( result, source );

			// Test if setters and getters are copied correctly
			result.a = 5;
			expect( targetValue ).toBe( 1 ); // Should not change
			expect( sourceValue ).toBe( 5 ); // Should change
			expect( result.a ).toBe( 3 ); // Should return the getter's value

			expect(
				Object.getOwnPropertyDescriptor( result, 'a' )?.get
			).toBeDefined();
			expect(
				Object.getOwnPropertyDescriptor( result, 'a' )?.set
			).toBeDefined();
		} );

		it( 'should handle getters when overwrite is false', () => {
			const target = {
				get a() {
					return 1;
				},
				b: 1,
			};
			const source = {
				a: 2,
				get b() {
					return 2;
				},
			};
			const result: Record< string, any > = {};
			deepMerge( result, target, false );
			deepMerge( result, source, false );
			expect( result.a ).toBe( 1 );
			expect( result.b ).toBe( 1 );
			expect(
				Object.getOwnPropertyDescriptor( result, 'a' )?.get
			).toBeDefined();
			expect(
				Object.getOwnPropertyDescriptor( result, 'b' )?.get
			).toBeUndefined();
		} );

		it( 'should ignore non-plain objects', () => {
			const target = { a: 1 };
			const source = new Date();
			const result = { ...target };
			deepMerge( result, source );
			expect( result ).toEqual( { a: 1 } );
		} );

		it( 'should handle null values', () => {
			const target = { a: 1, b: null };
			const source = { b: 2, c: null };
			const result = {};
			deepMerge( result, target );
			deepMerge( result, source );
			expect( result ).toEqual( { a: 1, b: 2, c: null } );
		} );

		it( 'should handle undefined values', () => {
			const target = { a: 1, b: undefined };
			const source = { b: 2, c: undefined };
			const result = {};
			deepMerge( result, target );
			deepMerge( result, source );
			expect( result ).toEqual( { a: 1, b: 2, c: undefined } );
		} );

		it( 'should handle undefined values when overwrite is false', () => {
			const target = { a: 1, b: undefined };
			const source = { b: 2, c: undefined };
			const result = {};
			deepMerge( result, target, false );
			deepMerge( result, source, false );
			expect( result ).toEqual( { a: 1, b: undefined, c: undefined } );
		} );

		it( 'should handle deleted values when overwrite is false', () => {
			const target = { a: 1 };
			const source = { a: 2 };
			const result: Record< string, any > = {};
			deepMerge( result, target, false );
			delete result.a;
			deepMerge( result, source, false );
			expect( result ).toEqual( { a: 2 } );
		} );

		it( 'should never create signals', () => {
			const target = { a: 1, b: { x: 10 } };
			const source = { a: 2, b: { y: 20 }, c: 3 };
			const result = proxifyState(
				'test',
				{} as typeof target & typeof source
			);
			deepMerge( result, target );
			deepMerge( result, source, false );

			expect( hasPropSignal( result, 'a' ) ).toBe( false );
			expect( hasPropSignal( result, 'b' ) ).toBe( false );
			expect( hasPropSignal( result, 'c' ) ).toBe( false );

			const proxyB = getProxyFromObject( peek( result, 'b' ) )!;
			expect( hasPropSignal( proxyB, 'x' ) ).toBe( false );
			expect( hasPropSignal( proxyB, 'y' ) ).toBe( false );
		} );

		it( 'should update signals when they exist', () => {
			const target = { a: 1, b: { x: 10 } };
			const source = { a: 2, b: { x: 20, y: 30 }, c: 3 };
			const result = proxifyState< any >( 'test', {} );

			const spyA = jest.fn( () => result.a );
			effect( spyA );

			expect( spyA ).toHaveBeenCalledTimes( 1 );

			deepMerge( result, target );

			const spyBx = jest.fn( () => result.b.x );
			effect( spyBx );
			expect( spyA ).toHaveBeenCalledTimes( 2 );
			expect( spyBx ).toHaveBeenCalledTimes( 1 );

			deepMerge( result, source );

			expect( spyA ).toHaveBeenCalledTimes( 3 );
			expect( spyBx ).toHaveBeenCalledTimes( 2 );

			expect( hasPropSignal( result, 'a' ) ).toBe( true );
			expect( hasPropSignal( result, 'b' ) ).toBe( true );
			expect( hasPropSignal( result, 'c' ) ).toBe( false );

			const proxyB = getProxyFromObject( peek( result, 'b' ) )!;
			expect( hasPropSignal( proxyB, 'x' ) ).toBe( true );
			expect( hasPropSignal( proxyB, 'y' ) ).toBe( false );
		} );

		it( 'should batch all signal updates together', () => {
			const target = { a: 1, b: 2 };
			const source = { a: 3, b: 4 };
			const result = proxifyState< any >( 'test', {} );

			const spy = jest.fn( () => ( result.a, result.b ) );
			effect( spy );

			expect( spy ).toHaveBeenCalledTimes( 1 );

			deepMerge( result, target );

			expect( spy ).toHaveBeenCalledTimes( 2 );

			deepMerge( result, source );

			expect( spy ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'should update iterable signals when new keys are added', () => {
			const target = proxifyState< any >( 'test', { a: 1, b: 2 } );
			const source = { a: 1, b: 2, c: 3 };

			let keys: any;
			const spy = jest.fn( () => {
				keys = Object.keys( target );
			} );
			effect( spy );

			expect( spy ).toHaveBeenCalledTimes( 1 );

			deepMerge( target, source, false );

			expect( spy ).toHaveBeenCalledTimes( 2 );
			expect( keys ).toEqual( [ 'a', 'b', 'c' ] );
		} );

		it( 'should handle deeply nested properties that are initially undefined', () => {
			const target: any = proxifyState( 'test', {} );

			let deepValue: any;
			const spy = jest.fn( () => {
				deepValue = target.a?.b?.c?.d;
			} );
			effect( spy );

			// Initial call, the deep value is undefined
			expect( spy ).toHaveBeenCalledTimes( 1 );
			expect( deepValue ).toBeUndefined();

			// Use deepMerge to add a deeply nested object to the target
			deepMerge( target, { a: { b: { c: { d: 'test value' } } } } );

			// The effect should be called again
			expect( spy ).toHaveBeenCalledTimes( 2 );
			expect( deepValue ).toBe( 'test value' );

			// Reading the value directly should also work
			expect( target.a.b.c.d ).toBe( 'test value' );

			// Modify the nested value
			target.a.b.c.d = 'new test value';

			// The effect should be called again
			expect( spy ).toHaveBeenCalledTimes( 3 );
			expect( deepValue ).toBe( 'new test value' );
		} );

		it( 'should overwrite values that become objects', () => {
			const target: any = proxifyState( 'test', { message: 'hello' } );

			let message: any;
			const spy = jest.fn( () => ( message = target.message ) );
			effect( spy );

			expect( spy ).toHaveBeenCalledTimes( 1 );
			expect( message ).toBe( 'hello' );

			deepMerge( target, {
				message: { content: 'hello', fontStyle: 'italic' },
			} );

			expect( spy ).toHaveBeenCalledTimes( 2 );
			expect( message ).toEqual( {
				content: 'hello',
				fontStyle: 'italic',
			} );

			expect( target.message ).toEqual( {
				content: 'hello',
				fontStyle: 'italic',
			} );
		} );

		it( 'should not overwrite values that become objects if `override` is false', () => {
			const target: any = proxifyState( 'test', { message: 'hello' } );

			let message: any;
			const spy = jest.fn( () => ( message = target.message ) );
			effect( spy );

			expect( spy ).toHaveBeenCalledTimes( 1 );
			expect( message ).toBe( 'hello' );

			deepMerge(
				target,
				{ message: { content: 'hello', fontStyle: 'italic' } },
				false
			);

			expect( spy ).toHaveBeenCalledTimes( 1 );
			expect( message ).toBe( 'hello' );
			expect( target.message ).toBe( 'hello' );
			expect( target.message.content ).toBeUndefined();
			expect( target.message.fontStyle ).toBeUndefined();
		} );

		it( 'should keep reactivity of arrays that are initially undefined', () => {
			const target: any = proxifyState( 'test', {} );

			let deepValue: any;
			const spy = jest.fn( () => {
				deepValue = target.array?.[ 0 ];
			} );
			effect( spy );

			// Initial call, the deep value is undefined
			expect( spy ).toHaveBeenCalledTimes( 1 );
			expect( deepValue ).toBeUndefined();

			// Use deepMerge to add an array to the target
			deepMerge( target, { array: [ 'value 1' ] } );

			// The effect should be called again
			expect( spy ).toHaveBeenCalledTimes( 2 );
			expect( deepValue ).toBe( 'value 1' );

			// Modify the array value
			target.array[ 0 ] = 'value 2';

			// The effect should be called again
			expect( spy ).toHaveBeenCalledTimes( 3 );
			expect( deepValue ).toBe( 'value 2' );
		} );

		describe( 'arrays', () => {
			it( 'should handle arrays', () => {
				const target = { a: [ 1, 2 ] };
				const source = { a: [ 3, 4 ] };
				const result = {};
				deepMerge( result, target );
				deepMerge( result, source );
				expect( result ).toEqual( { a: [ 3, 4 ] } );
			} );

			it( 'should handle arrays when overwrite is false', () => {
				const target = { a: [ 1, 2 ] };
				const source = { a: [ 3, 4 ] };
				const result = {};
				deepMerge( result, target, false );
				deepMerge( result, source, false );
				expect( result ).toEqual( { a: [ 1, 2 ] } );
			} );

			it( 'should add new array from source if not present in target', () => {
				const target = { a: 1 };
				const source = { arr: [ 1, 2, 3 ] };
				const result = {};
				deepMerge( result, target );
				deepMerge( result, source );
				expect( result ).toEqual( { a: 1, arr: [ 1, 2, 3 ] } );
			} );

			it( 'should handle nested arrays', () => {
				const target = { nested: { arr: [ 1, 2 ] } };
				const source = { nested: { arr: [ 3, 4, 5 ] } };
				const result = {};
				deepMerge( result, target );
				deepMerge( result, source );
				expect( result ).toEqual( { nested: { arr: [ 3, 4, 5 ] } } );
			} );

			it( 'should handle object with array as target and object with object as source', () => {
				const target = { arr: [ 1, 2, 3 ] };
				const source = { arr: { 1: 'two', 3: 'four' } };
				const result: any = {};
				deepMerge( result, target );
				deepMerge( result, source );
				expect( result ).toEqual( { arr: { 1: 'two', 3: 'four' } } );
			} );

			it( 'should handle object with object as target and object with array as source', () => {
				const target = { arr: { 0: 'zero', 2: 'two' } };
				const source = { arr: [ 'a', 'b', 'c' ] };
				const result = {};
				deepMerge( result, target );
				deepMerge( result, source );
				expect( result ).toEqual( { arr: [ 'a', 'b', 'c' ] } );
			} );

			it( 'should handle objects with arrays containing object elements', () => {
				const target = { arr: [ { a: 1 }, { b: 2 } ] };
				const source = { arr: [ { a: 2 }, { c: 3 } ] };
				const result: any = {};
				deepMerge( result, target );
				deepMerge( result, source );
				expect( result ).toEqual( { arr: [ { a: 2 }, { c: 3 } ] } );
			} );
		} );
	} );
} );
