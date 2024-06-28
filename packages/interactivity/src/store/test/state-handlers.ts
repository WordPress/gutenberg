/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jest/no-identical-title */
/* eslint-disable @typescript-eslint/no-shadow */
/**
 * External dependencies
 */
import { Signal, effect, signal } from '@preact/signals-core';
/**
 * Internal dependencies
 */
import { proxify } from '../proxies';
import { stateHandlers } from '../handlers';

type State = {
	a?: number;
	nested: { b?: number };
	array: ( number | State[ 'nested' ] )[];
};

const proxifyState = < T extends object >( obj: T ) =>
	proxify( obj, stateHandlers, 'test' ) as T;

describe( 'interactivity api handlers', () => {
	let nested = { b: 2 };
	let array = [ 3, nested ];
	let state: State = { a: 1, nested, array };
	let store = proxifyState( state );

	const window = globalThis as any;

	beforeEach( () => {
		nested = { b: 2 };
		array = [ 3, nested ];
		state = { a: 1, nested, array };
		store = proxifyState( state );
	} );

	describe( 'get - plain', () => {
		it( 'should return plain objects/arrays', () => {
			expect( store.nested ).toEqual( { b: 2 } );
			expect( store.array ).toEqual( [ 3, { b: 2 } ] );
			expect( store.array[ 1 ] ).toEqual( { b: 2 } );
		} );

		it( 'should return plain primitives', () => {
			expect( store.a ).toBe( 1 );
			expect( store.nested.b ).toBe( 2 );
			expect( store.array[ 0 ] ).toBe( 3 );
			expect(
				typeof store.array[ 1 ] === 'object' && store.array[ 1 ].b
			).toBe( 2 );
			expect( store.array.length ).toBe( 2 );
		} );

		it( 'should support reading from getters', () => {
			const store = proxifyState( {
				counter: 1,
				get double() {
					return store.counter * 2;
				},
			} );
			expect( store.double ).toBe( 2 );
			store.counter = 2;
			expect( store.double ).toBe( 4 );
		} );

		it( 'should support getters returning other parts of the state', () => {
			const store = proxifyState( {
				switch: 'a',
				a: { data: 'a' },
				b: { data: 'b' },
				get aOrB() {
					return store.switch === 'a' ? store.a : store.b;
				},
			} );
			expect( store.aOrB.data ).toBe( 'a' );
			store.switch = 'b';
			expect( store.aOrB.data ).toBe( 'b' );
		} );

		it( 'should support getters using ownKeys traps', () => {
			const state = proxifyState( {
				x: {
					a: 1,
					b: 2,
				},
				get y() {
					return Object.values( state.x );
				},
			} );

			expect( state.y ).toEqual( [ 1, 2 ] );
		} );

		it( 'should work with normal functions', () => {
			const store = proxifyState( {
				value: 1,
				isBigger: ( newValue: number ): boolean =>
					store.value < newValue,
				sum( newValue: number ): number {
					return store.value + newValue;
				},
				replace: ( newValue: number ): void => {
					store.value = newValue;
				},
			} );
			expect( store.isBigger( 2 ) ).toBe( true );
			expect( store.sum( 2 ) ).toBe( 3 );
			expect( store.value ).toBe( 1 );
			store.replace( 2 );
			expect( store.value ).toBe( 2 );
		} );
	} );

	describe( 'set', () => {
		it( 'should update like plain objects/arrays', () => {
			expect( store.a ).toBe( 1 );
			expect( store.nested.b ).toBe( 2 );
			store.a = 2;
			store.nested.b = 3;
			expect( store.a ).toBe( 2 );
			expect( store.nested.b ).toBe( 3 );
		} );

		it( 'should support setting values with setters', () => {
			const store = proxifyState( {
				counter: 1,
				get double() {
					return store.counter * 2;
				},
				set double( val ) {
					store.counter = val / 2;
				},
			} );
			expect( store.counter ).toBe( 1 );
			store.double = 4;
			expect( store.counter ).toBe( 2 );
		} );

		it( 'should update array length', () => {
			expect( store.array.length ).toBe( 2 );
			store.array.push( 4 );
			expect( store.array.length ).toBe( 3 );
			store.array.splice( 1, 2 );
			expect( store.array.length ).toBe( 1 );
		} );

		it( 'should update when mutations happen', () => {
			expect( store.a ).toBe( 1 );
			store.a = 11;
			expect( store.a ).toBe( 11 );
		} );

		it( 'should support setting getters on the fly', () => {
			const store = proxifyState< { counter: number; double?: number } >(
				{
					counter: 1,
				}
			);
			Object.defineProperty( store, 'double', {
				get() {
					return store.counter * 2;
				},
			} );
			expect( store.double ).toBe( 2 );
			store.counter = 2;
			expect( store.double ).toBe( 4 );
		} );

		it( 'should copy object like plain JavaScript', () => {
			const store = proxifyState< {
				a?: { id: number; nested: { id: number } };
				b: { id: number; nested: { id: number } };
			} >( {
				b: { id: 1, nested: { id: 1 } },
			} );

			store.a = store.b;

			expect( store.a.id ).toBe( 1 );
			expect( store.b.id ).toBe( 1 );
			expect( store.a.nested.id ).toBe( 1 );
			expect( store.b.nested.id ).toBe( 1 );

			store.a.id = 2;
			store.a.nested.id = 2;
			expect( store.a.id ).toBe( 2 );
			expect( store.b.id ).toBe( 2 );
			expect( store.a.nested.id ).toBe( 2 );
			expect( store.b.nested.id ).toBe( 2 );

			store.b.id = 3;
			store.b.nested.id = 3;
			expect( store.b.id ).toBe( 3 );
			expect( store.a.id ).toBe( 3 );
			expect( store.a.nested.id ).toBe( 3 );
			expect( store.b.nested.id ).toBe( 3 );

			store.a.id = 4;
			store.a.nested.id = 4;
			expect( store.a.id ).toBe( 4 );
			expect( store.b.id ).toBe( 4 );
			expect( store.a.nested.id ).toBe( 4 );
			expect( store.b.nested.id ).toBe( 4 );
		} );

		it( 'should be able to reset values with Object.assign', () => {
			const initialNested = { ...nested };
			const initialState = { ...state, nested: initialNested };
			store.a = 2;
			store.nested.b = 3;
			Object.assign( store, initialState );
			expect( store.a ).toBe( 1 );
			expect( store.nested.b ).toBe( 2 );
		} );
	} );
} );
