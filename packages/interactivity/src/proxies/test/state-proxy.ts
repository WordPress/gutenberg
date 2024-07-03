/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jest/no-identical-title */
/* eslint-disable @typescript-eslint/no-shadow */
/**
 * External dependencies
 */
import { effect } from '@preact/signals-core';
/**
 * Internal dependencies
 */
import { proxifyState } from '../';
import {
	setScope,
	resetScope,
	setNamespace,
	resetNamespace,
	getContext,
	getElement,
} from '../../hooks';

type State = {
	a?: number;
	nested: { b?: number };
	array: ( number | State[ 'nested' ] )[];
};

const withScopeAndNs = ( scope, ns, callback ) => () => {
	setScope( scope );
	setNamespace( ns );
	try {
		return callback();
	} finally {
		resetNamespace();
		resetScope();
	}
};

const proxifyStateTest = < T extends object >( obj: T ) =>
	proxifyState( obj, 'test' ) as T;

describe( 'interactivity api - state proxy', () => {
	let nested = { b: 2 };
	let array = [ 3, nested ];
	let raw: State = { a: 1, nested, array };
	let state = proxifyStateTest( raw );

	beforeEach( () => {
		nested = { b: 2 };
		array = [ 3, nested ];
		raw = { a: 1, nested, array };
		state = proxifyStateTest( raw );
	} );

	describe( 'get - plain', () => {
		it( 'should return plain objects/arrays', () => {
			expect( state.nested ).toEqual( { b: 2 } );
			expect( state.array ).toEqual( [ 3, { b: 2 } ] );
			expect( state.array[ 1 ] ).toEqual( { b: 2 } );
		} );

		it( 'should return plain primitives', () => {
			expect( state.a ).toBe( 1 );
			expect( state.nested.b ).toBe( 2 );
			expect( state.array[ 0 ] ).toBe( 3 );
			expect(
				typeof state.array[ 1 ] === 'object' && state.array[ 1 ].b
			).toBe( 2 );
			expect( state.array.length ).toBe( 2 );
		} );

		it( 'should support reading from getters', () => {
			const state = proxifyStateTest( {
				counter: 1,
				get double() {
					return state.counter * 2;
				},
			} );
			expect( state.double ).toBe( 2 );
			state.counter = 2;
			expect( state.double ).toBe( 4 );
		} );

		it( 'should support getters returning other parts of the raw', () => {
			const state = proxifyStateTest( {
				switch: 'a',
				a: { data: 'a' },
				b: { data: 'b' },
				get aOrB() {
					return state.switch === 'a' ? state.a : state.b;
				},
			} );
			expect( state.aOrB.data ).toBe( 'a' );
			state.switch = 'b';
			expect( state.aOrB.data ).toBe( 'b' );
		} );

		it( 'should support getters using ownKeys traps', () => {
			const state = proxifyStateTest( {
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

		it( 'should support getters accessing the scope', () => {
			const state = proxifyStateTest( {
				get y() {
					const ctx = getContext< { value: string } >();
					return ctx.value;
				},
			} );

			const scope = { context: { test: { value: 'from context' } } };
			try {
				setScope( scope as any );
				setNamespace( 'test' );
				expect( state.y ).toBe( 'from context' );
			} finally {
				resetNamespace();
				resetScope();
			}
		} );

		it( 'should work with normal functions', () => {
			const state = proxifyStateTest( {
				value: 1,
				isBigger: ( newValue: number ): boolean =>
					state.value < newValue,
				sum( newValue: number ): number {
					return state.value + newValue;
				},
				replace: ( newValue: number ): void => {
					state.value = newValue;
				},
			} );
			expect( state.isBigger( 2 ) ).toBe( true );
			expect( state.sum( 2 ) ).toBe( 3 );
			expect( state.value ).toBe( 1 );
			state.replace( 2 );
			expect( state.value ).toBe( 2 );
		} );

		it( 'should work with normal functions accessing the scope', () => {
			const state = proxifyStateTest( {
				sumContextValue( newValue: number ): number {
					const ctx = getContext< { value: number } >();
					return ctx.value + newValue;
				},
			} );

			const scope = { context: { test: { value: 1 } } };
			try {
				setScope( scope as any );
				setNamespace( 'test' );
				expect( state.sumContextValue( 2 ) ).toBe( 3 );
			} finally {
				resetNamespace();
				resetScope();
			}
		} );
	} );

	describe( 'set', () => {
		it( 'should update like plain objects/arrays', () => {
			expect( state.a ).toBe( 1 );
			expect( state.nested.b ).toBe( 2 );
			state.a = 2;
			state.nested.b = 3;
			expect( state.a ).toBe( 2 );
			expect( state.nested.b ).toBe( 3 );
		} );

		it( 'should support setting values with setters', () => {
			const state = proxifyStateTest( {
				counter: 1,
				get double() {
					return state.counter * 2;
				},
				set double( val ) {
					state.counter = val / 2;
				},
			} );
			expect( state.counter ).toBe( 1 );
			state.double = 4;
			expect( state.counter ).toBe( 2 );
		} );

		it( 'should update array length', () => {
			expect( state.array.length ).toBe( 2 );
			state.array.push( 4 );
			expect( state.array.length ).toBe( 3 );
			state.array.splice( 1, 2 );
			expect( state.array.length ).toBe( 1 );
		} );

		it( 'should update when mutations happen', () => {
			expect( state.a ).toBe( 1 );
			state.a = 11;
			expect( state.a ).toBe( 11 );
		} );

		it( 'should support setting getters on the fly', () => {
			const state = proxifyStateTest< {
				counter: number;
				double?: number;
			} >( {
				counter: 1,
			} );
			Object.defineProperty( state, 'double', {
				get() {
					return state.counter * 2;
				},
			} );
			expect( state.double ).toBe( 2 );
			state.counter = 2;
			expect( state.double ).toBe( 4 );
		} );

		it( 'should copy object like plain JavaScript', () => {
			const state = proxifyStateTest< {
				a?: { id: number; nested: { id: number } };
				b: { id: number; nested: { id: number } };
			} >( {
				b: { id: 1, nested: { id: 1 } },
			} );

			state.a = state.b;

			expect( state.a.id ).toBe( 1 );
			expect( state.b.id ).toBe( 1 );
			expect( state.a.nested.id ).toBe( 1 );
			expect( state.b.nested.id ).toBe( 1 );

			state.a.id = 2;
			state.a.nested.id = 2;
			expect( state.a.id ).toBe( 2 );
			expect( state.b.id ).toBe( 2 );
			expect( state.a.nested.id ).toBe( 2 );
			expect( state.b.nested.id ).toBe( 2 );

			state.b.id = 3;
			state.b.nested.id = 3;
			expect( state.b.id ).toBe( 3 );
			expect( state.a.id ).toBe( 3 );
			expect( state.a.nested.id ).toBe( 3 );
			expect( state.b.nested.id ).toBe( 3 );

			state.a.id = 4;
			state.a.nested.id = 4;
			expect( state.a.id ).toBe( 4 );
			expect( state.b.id ).toBe( 4 );
			expect( state.a.nested.id ).toBe( 4 );
			expect( state.b.nested.id ).toBe( 4 );
		} );

		it( 'should be able to reset values with Object.assign', () => {
			const initialNested = { ...nested };
			const initialState = { ...raw, nested: initialNested };
			state.a = 2;
			state.nested.b = 3;
			Object.assign( state, initialState );
			expect( state.a ).toBe( 1 );
			expect( state.nested.b ).toBe( 2 );
		} );

		it( 'should keep assigned object references internally', () => {
			const obj = {};
			state.nested = obj;
			expect( raw.nested ).toBe( obj );
		} );

		it( 'should keep object references across namespaces', () => {
			const raw1 = { obj: {} };
			const raw2 = { obj: {} };
			const state1 = proxifyState( raw1, 'test-1' );
			const state2 = proxifyState( raw2, 'test-2' );
			state2.obj = state1.obj;
			expect( state2.obj ).toBe( state1.obj );
			expect( raw2.obj ).toBe( state1.obj );
		} );
	} );

	describe( 'computations', () => {
		it( 'should subscribe to values mutated with setters', () => {
			const state = proxifyStateTest( {
				counter: 1,
				get double() {
					return state.counter * 2;
				},
				set double( val ) {
					state.counter = val / 2;
				},
			} );
			let counter = 0;
			let double = 0;

			effect( () => {
				counter = state.counter;
				double = state.double;
			} );

			expect( counter ).toBe( 1 );
			expect( double ).toBe( 2 );
			state.double = 4;
			expect( counter ).toBe( 2 );
			expect( double ).toBe( 4 );
		} );

		it( 'should subscribe to changes when an item is removed from the array', () => {
			const state = proxifyStateTest( [ 0, 0, 0 ] );
			let sum = 0;

			effect( () => {
				sum = 0;
				sum = state.reduce( ( sum ) => sum + 1, 0 );
			} );

			expect( sum ).toBe( 3 );
			state.splice( 2, 1 );
			expect( sum ).toBe( 2 );
		} );

		it( 'should subscribe to changes to for..in loops', () => {
			const raw: Record< string, number > = { a: 0, b: 0 };
			const state = proxifyStateTest( raw );
			let sum = 0;

			effect( () => {
				sum = 0;
				for ( const _ in state ) {
					sum += 1;
				}
			} );

			expect( sum ).toBe( 2 );

			state.c = 0;
			expect( sum ).toBe( 3 );

			delete state.c;
			expect( sum ).toBe( 2 );

			state.c = 0;
			expect( sum ).toBe( 3 );
		} );

		it( 'should subscribe to changes for Object.getOwnPropertyNames()', () => {
			const raw: Record< string, number > = { a: 1, b: 2 };
			const state = proxifyStateTest( raw );
			let sum = 0;

			effect( () => {
				sum = 0;
				const keys = Object.getOwnPropertyNames( state );
				for ( const _ of keys ) {
					sum += 1;
				}
			} );

			expect( sum ).toBe( 2 );

			state.c = 0;
			expect( sum ).toBe( 3 );

			delete state.a;
			expect( sum ).toBe( 2 );
		} );

		it( 'should subscribe to changes to Object.keys/values/entries()', () => {
			const raw: Record< string, number > = { a: 1, b: 2 };
			const state = proxifyStateTest( raw );
			let keys = 0;
			let values = 0;
			let entries = 0;

			effect( () => {
				keys = 0;
				Object.keys( state ).forEach( () => ( keys += 1 ) );
			} );

			effect( () => {
				values = 0;
				Object.values( state ).forEach( () => ( values += 1 ) );
			} );

			effect( () => {
				entries = 0;
				Object.entries( state ).forEach( () => ( entries += 1 ) );
			} );

			expect( keys ).toBe( 2 );
			expect( values ).toBe( 2 );
			expect( entries ).toBe( 2 );

			state.c = 0;
			expect( keys ).toBe( 3 );
			expect( values ).toBe( 3 );
			expect( entries ).toBe( 3 );

			delete state.a;
			expect( keys ).toBe( 2 );
			expect( values ).toBe( 2 );
			expect( entries ).toBe( 2 );
		} );

		it( 'should subscribe to changes to for..of loops', () => {
			const state = proxifyStateTest( [ 0, 0 ] );
			let sum = 0;

			effect( () => {
				sum = 0;
				for ( const _ of state ) {
					sum += 1;
				}
			} );

			expect( sum ).toBe( 2 );

			state.push( 0 );
			expect( sum ).toBe( 3 );

			state.splice( 0, 1 );
			expect( sum ).toBe( 2 );
		} );

		it( 'should subscribe to implicit changes in length', () => {
			const state = proxifyStateTest( [ 'foo', 'bar' ] );
			let x = '';

			effect( () => {
				x = state.join( ' ' );
			} );

			expect( x ).toBe( 'foo bar' );

			state.push( 'baz' );
			expect( x ).toBe( 'foo bar baz' );

			state.splice( 0, 1 );
			expect( x ).toBe( 'bar baz' );
		} );

		it( 'should subscribe to changes when deleting properties', () => {
			let x, y;

			effect( () => {
				x = state.a;
			} );

			effect( () => {
				y = state.nested.b;
			} );

			expect( x ).toBe( 1 );
			delete state.a;
			expect( x ).toBe( undefined );

			expect( y ).toBe( 2 );
			delete state.nested.b;
			expect( y ).toBe( undefined );
		} );

		it( 'should subscribe to changes when mutating objects', () => {
			let x, y;

			const state = proxifyStateTest< {
				a?: { id: number; nested: { id: number } };
				b: { id: number; nested: { id: number } }[];
			} >( {
				b: [
					{ id: 1, nested: { id: 1 } },
					{ id: 2, nested: { id: 2 } },
				],
			} );

			effect( () => {
				x = state.a?.id;
			} );

			effect( () => {
				y = state.a?.nested.id;
			} );

			expect( x ).toBe( undefined );
			expect( y ).toBe( undefined );

			state.a = state.b[ 0 ];

			expect( x ).toBe( 1 );
			expect( y ).toBe( 1 );

			state.a = state.b[ 1 ];
			expect( x ).toBe( 2 );
			expect( y ).toBe( 2 );

			state.a = undefined;
			expect( x ).toBe( undefined );
			expect( y ).toBe( undefined );

			state.a = state.b[ 1 ];
			expect( x ).toBe( 2 );
			expect( y ).toBe( 2 );
		} );

		it( 'should trigger effects after mutations happen', () => {
			let x;
			effect( () => {
				x = state.a;
			} );
			expect( x ).toBe( 1 );
			state.a = 11;
			expect( x ).toBe( 11 );
		} );

		it( 'should subscribe corretcly from getters', () => {
			let x;
			const state = proxifyStateTest( {
				counter: 1,
				get double() {
					return state.counter * 2;
				},
			} );
			effect( () => ( x = state.double ) );
			expect( x ).toBe( 2 );
			state.counter = 2;
			expect( x ).toBe( 4 );
		} );

		it( 'should subscribe corretcly from getters returning other parts of the state', () => {
			let data;
			const state = proxifyStateTest( {
				switch: 'a',
				a: { data: 'a' },
				b: { data: 'b' },
				get aOrB() {
					return state.switch === 'a' ? state.a : state.b;
				},
			} );
			effect( () => ( data = state.aOrB.data ) );
			expect( data ).toBe( 'a' );
			state.switch = 'b';
			expect( data ).toBe( 'b' );
		} );

		it( 'should subscribe to changes', () => {
			const spy1 = jest.fn( () => state.a );
			const spy2 = jest.fn( () => state.nested );
			const spy3 = jest.fn( () => state.nested.b );
			const spy4 = jest.fn( () => state.array[ 0 ] );
			const spy5 = jest.fn(
				() => typeof state.array[ 1 ] === 'object' && state.array[ 1 ].b
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

			state.a = 11;

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 1 );
			expect( spy3 ).toHaveBeenCalledTimes( 1 );
			expect( spy4 ).toHaveBeenCalledTimes( 1 );
			expect( spy5 ).toHaveBeenCalledTimes( 1 );

			state.nested.b = 22;

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 1 );
			expect( spy3 ).toHaveBeenCalledTimes( 2 );
			expect( spy4 ).toHaveBeenCalledTimes( 1 );
			expect( spy5 ).toHaveBeenCalledTimes( 2 ); // nested also exists array[1]

			state.nested = { b: 222 };

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 1 );
			expect( spy5 ).toHaveBeenCalledTimes( 2 ); // now state.nested has a different reference

			state.array[ 0 ] = 33;

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 2 );

			if ( typeof state.array[ 1 ] === 'object' ) {
				state.array[ 1 ].b = 2222;
			}

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 3 );

			state.array[ 1 ] = { b: 22222 };

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 4 );

			state.array.push( 4 );

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 4 );

			state.array[ 3 ] = 5;

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 2 );
			expect( spy5 ).toHaveBeenCalledTimes( 4 );

			state.array = [ 333, { b: 222222 } ];

			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );
			expect( spy3 ).toHaveBeenCalledTimes( 3 );
			expect( spy4 ).toHaveBeenCalledTimes( 3 );
			expect( spy5 ).toHaveBeenCalledTimes( 5 );
		} );

		it( 'should subscribe to array length', () => {
			const array = [ 1 ];
			const state = proxifyStateTest( { array } );
			const spy1 = jest.fn( () => state.array.length );
			const spy2 = jest.fn( () => state.array.map( ( i: number ) => i ) );

			effect( spy1 );
			effect( spy2 );
			expect( spy1 ).toHaveBeenCalledTimes( 1 );
			expect( spy2 ).toHaveBeenCalledTimes( 1 );

			state.array.push( 2 );
			expect( state.array.length ).toBe( 2 );
			expect( spy1 ).toHaveBeenCalledTimes( 2 );
			expect( spy2 ).toHaveBeenCalledTimes( 2 );

			state.array[ 2 ] = 3;
			expect( state.array.length ).toBe( 3 );
			expect( spy1 ).toHaveBeenCalledTimes( 3 );
			expect( spy2 ).toHaveBeenCalledTimes( 3 );

			state.array = state.array.filter( ( i: number ) => i <= 2 );
			expect( state.array.length ).toBe( 2 );
			expect( spy1 ).toHaveBeenCalledTimes( 4 );
			expect( spy2 ).toHaveBeenCalledTimes( 4 );
		} );

		it( 'should be able to reset values with Object.assign and still react to changes', () => {
			const initialNested = { ...nested };
			const initialState = { ...raw, nested: initialNested };
			let a, b;

			effect( () => {
				a = state.a;
			} );
			effect( () => {
				b = state.nested.b;
			} );

			state.a = 2;
			state.nested.b = 3;

			expect( a ).toBe( 2 );
			expect( b ).toBe( 3 );

			Object.assign( state, initialState );

			expect( a ).toBe( 1 );
			expect( b ).toBe( 2 );
		} );

		it( 'should keep subscribed to properties that become getters', () => {
			const state = proxifyStateTest( {
				number: 1,
			} );

			let number = 0;

			effect( () => {
				number = state.number;
			} );

			expect( number ).toBe( 1 );
			state.number = 2;
			expect( number ).toBe( 2 );
			Object.defineProperty( state, 'number', {
				get: () => 3,
				configurable: true,
			} );
			expect( number ).toBe( 3 );
		} );

		it( 'should react to changes in getter subscriptions', () => {
			const state = proxifyStateTest( {
				number: 1,
				otherNumber: 3,
			} );

			let number = 0;

			effect( () => {
				number = state.number;
			} );

			expect( number ).toBe( 1 );
			state.number = 2;
			expect( number ).toBe( 2 );
			Object.defineProperty( state, 'number', {
				get: () => state.otherNumber,
				configurable: true,
			} );
			expect( number ).toBe( 3 );
			state.otherNumber = 4;
			expect( number ).toBe( 4 );
		} );

		it( 'should react to changes in getter subscriptions if they become getters', () => {
			const state = proxifyStateTest( {
				number: 1,
				otherNumber: 3,
			} );

			let number = 0;

			effect( () => {
				number = state.number;
			} );

			expect( number ).toBe( 1 );
			state.number = 2;
			expect( number ).toBe( 2 );
			Object.defineProperty( state, 'number', {
				get: () => state.otherNumber,
				configurable: true,
			} );
			expect( number ).toBe( 3 );
			state.otherNumber = 4;
			expect( number ).toBe( 4 );
			Object.defineProperty( state, 'otherNumber', {
				get: () => 5,
				configurable: true,
			} );
			expect( number ).toBe( 5 );
		} );

		it( 'should allow getters to use `this`', () => {
			const state = proxifyStateTest( {
				number: 1,
				otherNumber: 3,
			} );

			let number = 0;

			effect( () => {
				number = state.number;
			} );

			expect( number ).toBe( 1 );
			state.number = 2;
			expect( number ).toBe( 2 );
			Object.defineProperty( state, 'number', {
				get() {
					return this.otherNumber;
				},
				configurable: true,
			} );
			expect( number ).toBe( 3 );
			state.otherNumber = 4;
			expect( number ).toBe( 4 );
		} );

		it( 'should support different scopes for the same getter', () => {
			const state = proxifyStateTest( {
				number: 1,
				get numWithTag() {
					let tag = 'No scope';
					try {
						tag = getContext< any >().tag;
					} catch ( e ) {}
					return `${ tag }: ${ this.number }`;
				},
			} );

			const scopeA = {
				context: { test: { tag: 'A' } },
			};
			const scopeB = {
				context: { test: { tag: 'B' } },
			};

			let resultA = '';
			let resultB = '';
			let resultNoScope = '';

			effect(
				withScopeAndNs( scopeA, 'test', () => {
					resultA = state.numWithTag;
				} )
			);
			effect(
				withScopeAndNs( scopeB, 'test', () => {
					resultB = state.numWithTag;
				} )
			);
			effect( () => {
				resultNoScope = state.numWithTag;
			} );

			expect( resultA ).toBe( 'A: 1' );
			expect( resultB ).toBe( 'B: 1' );
			expect( resultNoScope ).toBe( 'No scope: 1' );
			state.number = 2;
			expect( resultA ).toBe( 'A: 2' );
			expect( resultB ).toBe( 'B: 2' );
			expect( resultNoScope ).toBe( 'No scope: 2' );
		} );

		it( 'should throw an error in getters that require an scope', () => {
			const state = proxifyStateTest( {
				number: 1,
				get sumValueFromContext() {
					const ctx = getContext();
					return ctx
						? this.number + ( ctx as any ).value
						: this.number;
				},
				get sumValueFromElement() {
					const element = getElement();
					return element
						? this.number + element.attributes.value
						: this.number;
				},
			} );

			expect( () => state.sumValueFromContext ).toThrow();
			expect( () => state.sumValueFromElement ).toThrow();
		} );
	} );
} );
