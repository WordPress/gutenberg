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

	describe( 'computations', () => {
		it( 'should subscribe to values mutated with setters', () => {
			const store = proxifyState( {
				counter: 1,
				get double() {
					return store.counter * 2;
				},
				set double( val ) {
					store.counter = val / 2;
				},
			} );
			let counter = 0;
			let double = 0;

			effect( () => {
				counter = store.counter;
				double = store.double;
			} );

			expect( counter ).toBe( 1 );
			expect( double ).toBe( 2 );
			store.double = 4;
			expect( counter ).toBe( 2 );
			expect( double ).toBe( 4 );
		} );

		it( 'should subscribe to changes when an item is removed from the array', () => {
			const store = proxifyState( [ 0, 0, 0 ] );
			let sum = 0;

			effect( () => {
				sum = 0;
				sum = store.reduce( ( sum ) => sum + 1, 0 );
			} );

			expect( sum ).toBe( 3 );
			store.splice( 2, 1 );
			expect( sum ).toBe( 2 );
		} );

		it( 'should subscribe to changes to for..in loops', () => {
			const state: Record< string, number > = { a: 0, b: 0 };
			const store = proxifyState( state );
			let sum = 0;

			effect( () => {
				sum = 0;
				for ( const _ in store ) {
					sum += 1;
				}
			} );

			expect( sum ).toBe( 2 );

			store.c = 0;
			expect( sum ).toBe( 3 );

			delete store.c;
			expect( sum ).toBe( 2 );

			store.c = 0;
			expect( sum ).toBe( 3 );
		} );

		it( 'should subscribe to changes for Object.getOwnPropertyNames()', () => {
			const state: Record< string, number > = { a: 1, b: 2 };
			const store = proxifyState( state );
			let sum = 0;

			effect( () => {
				sum = 0;
				const keys = Object.getOwnPropertyNames( store );
				for ( const _ of keys ) {
					sum += 1;
				}
			} );

			expect( sum ).toBe( 2 );

			store.c = 0;
			expect( sum ).toBe( 3 );

			delete store.a;
			expect( sum ).toBe( 2 );
		} );

		it( 'should subscribe to changes to Object.keys/values/entries()', () => {
			const state: Record< string, number > = { a: 1, b: 2 };
			const store = proxifyState( state );
			let keys = 0;
			let values = 0;
			let entries = 0;

			effect( () => {
				keys = 0;
				Object.keys( store ).forEach( () => ( keys += 1 ) );
			} );

			effect( () => {
				values = 0;
				Object.values( store ).forEach( () => ( values += 1 ) );
			} );

			effect( () => {
				entries = 0;
				Object.entries( store ).forEach( () => ( entries += 1 ) );
			} );

			expect( keys ).toBe( 2 );
			expect( values ).toBe( 2 );
			expect( entries ).toBe( 2 );

			store.c = 0;
			expect( keys ).toBe( 3 );
			expect( values ).toBe( 3 );
			expect( entries ).toBe( 3 );

			delete store.a;
			expect( keys ).toBe( 2 );
			expect( values ).toBe( 2 );
			expect( entries ).toBe( 2 );
		} );

		it( 'should subscribe to changes to for..of loops', () => {
			const store = proxifyState( [ 0, 0 ] );
			let sum = 0;

			effect( () => {
				sum = 0;
				for ( const _ of store ) {
					sum += 1;
				}
			} );

			expect( sum ).toBe( 2 );

			store.push( 0 );
			expect( sum ).toBe( 3 );

			store.splice( 0, 1 );
			expect( sum ).toBe( 2 );
		} );

		it( 'should subscribe to implicit changes in length', () => {
			const store = proxifyState( [ 'foo', 'bar' ] );
			let x = '';

			effect( () => {
				x = store.join( ' ' );
			} );

			expect( x ).toBe( 'foo bar' );

			store.push( 'baz' );
			expect( x ).toBe( 'foo bar baz' );

			store.splice( 0, 1 );
			expect( x ).toBe( 'bar baz' );
		} );

		it( 'should subscribe to changes when deleting properties', () => {
			let x, y;

			effect( () => {
				x = store.a;
			} );

			effect( () => {
				y = store.nested.b;
			} );

			expect( x ).toBe( 1 );
			delete store.a;
			expect( x ).toBe( undefined );

			expect( y ).toBe( 2 );
			delete store.nested.b;
			expect( y ).toBe( undefined );
		} );

		it( 'should subscribe to changes when mutating objects', () => {
			let x, y;

			const store = proxifyState< {
				a?: { id: number; nested: { id: number } };
				b: { id: number; nested: { id: number } }[];
			} >( {
				b: [
					{ id: 1, nested: { id: 1 } },
					{ id: 2, nested: { id: 2 } },
				],
			} );

			effect( () => {
				x = store.a?.id;
			} );

			effect( () => {
				y = store.a?.nested.id;
			} );

			expect( x ).toBe( undefined );
			expect( y ).toBe( undefined );

			store.a = store.b[ 0 ];

			expect( x ).toBe( 1 );
			expect( y ).toBe( 1 );

			store.a = store.b[ 1 ];
			expect( x ).toBe( 2 );
			expect( y ).toBe( 2 );

			store.a = undefined;
			expect( x ).toBe( undefined );
			expect( y ).toBe( undefined );

			store.a = store.b[ 1 ];
			expect( x ).toBe( 2 );
			expect( y ).toBe( 2 );
		} );

		it( 'should trigger effects after mutations happen', () => {
			let x;
			effect( () => {
				x = store.a;
			} );
			expect( x ).toBe( 1 );
			store.a = 11;
			expect( x ).toBe( 11 );
		} );

		it( 'should subscribe corretcly from getters', () => {
			let x;
			const store = proxifyState( {
				counter: 1,
				get double() {
					return store.counter * 2;
				},
			} );
			effect( () => ( x = store.double ) );
			expect( x ).toBe( 2 );
			store.counter = 2;
			expect( x ).toBe( 4 );
		} );

		it( 'should subscribe corretcly from getters returning other parts of the store', () => {
			let data;
			const store = proxifyState( {
				switch: 'a',
				a: { data: 'a' },
				b: { data: 'b' },
				get aOrB() {
					return store.switch === 'a' ? store.a : store.b;
				},
			} );
			effect( () => ( data = store.aOrB.data ) );
			expect( data ).toBe( 'a' );
			store.switch = 'b';
			expect( data ).toBe( 'b' );
		} );

		it( 'should subscribe to changes', () => {
			const spy1 = jest.fn( () => store.a );
			const spy2 = jest.fn( () => store.nested );
			const spy3 = jest.fn( () => store.nested.b );
			const spy4 = jest.fn( () => store.array[ 0 ] );
			const spy5 = jest.fn(
				() => typeof store.array[ 1 ] === 'object' && store.array[ 1 ].b
			);

			effect( spy1 );
			effect( spy2 );
			effect( spy3 );
			effect( spy4 );
			effect( spy5 );

			expect( spy1 ).toHaveBeenCalledTimes( 1 );
			expect( spy2 ).toHaveBeenCalledTimes( 1 );
			expect( spy3 ).toHaveBeenCalledTimes( 1 );
			expect( spy4 ).toHaveBeenCalledTimes( 1 );
			expect( spy5 ).toHaveBeenCalledTimes( 1 );

			store.a = 11;

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 1 );
			expect( spy3 ).toHaveBeenCalledTimes( 1 );
			expect( spy4 ).toHaveBeenCalledTimes( 1 );
			expect( spy5 ).toHaveBeenCalledTimes( 1 );

			store.nested.b = 22;

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 1 );
			expect( spy3 ).toHaveBeenCalledTimes( 2 );
			expect( spy4 ).toHaveBeenCalledTimes( 1 );
			expect( spy5 ).toHaveBeenCalledTimes( 2 ); // nested also exists array[1]

			store.nested = { b: 222 };

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 1 );
			expect( spy5 ).toHaveBeenCalledTimes( 2 ); // now store.nested has a different reference

			store.array[ 0 ] = 33;

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 2 );

			if ( typeof store.array[ 1 ] === 'object' ) {
				store.array[ 1 ].b = 2222;
			}

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 3 );

			store.array[ 1 ] = { b: 22222 };

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 4 );

			store.array.push( 4 );

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 4 );

			store.array[ 3 ] = 5;

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 4 );

			store.array = [ 333, { b: 222222 } ];

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 3 );
			expect( spy5 ).toHaveBeenCalledTimes( 5 );
		} );

		it( 'should subscribe to array length', () => {
			const array = [ 1 ];
			const store = proxifyState( { array } );
			const spy1 = jest.fn( () => store.array.length );
			const spy2 = jest.fn( () => store.array.map( ( i: number ) => i ) );

			effect( spy1 );
			effect( spy2 );
			expect( spy1 ).toHaveBeenCalledTimes( 1 );
			expect( spy2 ).toHaveBeenCalledTimes( 1 );

			store.array.push( 2 );
			expect( store.array.length ).toBe( 2 );
			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );

			store.array[ 2 ] = 3;
			expect( store.array.length ).toBe( 3 );
			expect( spy1 ).toHaveBeenCalledTimes( 3 );
			expect( spy2 ).toHaveBeenCalledTimes( 3 );

			store.array = store.array.filter( ( i: number ) => i <= 2 );
			expect( store.array.length ).toBe( 2 );
			expect( spy1 ).toHaveBeenCalledTimes( 4 );
			expect( spy2 ).toHaveBeenCalledTimes( 4 );
		} );

		it( 'should be able to reset values with Object.assign and still react to changes', () => {
			const initialNested = { ...nested };
			const initialState = { ...state, nested: initialNested };
			let a, b;

			effect( () => {
				a = store.a;
			} );
			effect( () => {
				b = store.nested.b;
			} );

			store.a = 2;
			store.nested.b = 3;

			expect( a ).toBe( 2 );
			expect( b ).toBe( 3 );

			Object.assign( store, initialState );

			expect( a ).toBe( 1 );
			expect( b ).toBe( 2 );
		} );

		it( 'should keep subscribed to properties even when replaced by getters', () => {
			const store = proxifyState( {
				number: 1,
			} );

			let number = 0;

			effect( () => {
				number = store.number;
			} );

			expect( number ).toBe( 1 );
			store.number = 2;
			expect( number ).toBe( 2 );
			Object.defineProperty( store, 'number', {
				get: () => 3,
				configurable: true,
			} );
			expect( number ).toBe( 3 );
		} );

		it( 'should react to changes in getter subscriptions', () => {
			const store = proxifyState( {
				number: 1,
				otherNumber: 3,
			} );

			let number = 0;

			effect( () => {
				number = store.number;
			} );

			expect( number ).toBe( 1 );
			store.number = 2;
			expect( number ).toBe( 2 );
			Object.defineProperty( store, 'number', {
				get: () => store.otherNumber,
				configurable: true,
			} );
			expect( number ).toBe( 3 );
			store.otherNumber = 4;
			expect( number ).toBe( 4 );
		} );

		it( 'should react to changes in getter subscriptions even if they become getters', () => {
			const store = proxifyState( {
				number: 1,
				otherNumber: 3,
			} );

			let number = 0;

			effect( () => {
				number = store.number;
			} );

			expect( number ).toBe( 1 );
			store.number = 2;
			expect( number ).toBe( 2 );
			Object.defineProperty( store, 'number', {
				get: () => store.otherNumber,
				configurable: true,
			} );
			expect( number ).toBe( 3 );
			store.otherNumber = 4;
			expect( number ).toBe( 4 );
			Object.defineProperty( store, 'otherNumber', {
				get: () => 5,
				configurable: true,
			} );
			expect( number ).toBe( 5 );
		} );

		it( 'should allow getters to use `this`', () => {
			const store = proxifyState( {
				number: 1,
				otherNumber: 3,
			} );

			let number = 0;

			effect( () => {
				number = store.number;
			} );

			expect( number ).toBe( 1 );
			store.number = 2;
			expect( number ).toBe( 2 );
			Object.defineProperty( store, 'number', {
				get() {
					return this.otherNumber;
				},
				configurable: true,
			} );
			expect( number ).toBe( 3 );
			store.otherNumber = 4;
			expect( number ).toBe( 4 );
		} );
	} );
} );
