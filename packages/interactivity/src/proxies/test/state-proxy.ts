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
import { setScope, resetScope, getContext, getElement } from '../../scopes';
import { setNamespace, resetNamespace } from '../../namespaces';

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

describe( 'Interactivity API', () => {
	describe( 'state proxy', () => {
		let nested = { b: 2 };
		let array = [ 3, nested ];
		let raw: State = { a: 1, nested, array };
		let state = proxifyState( 'test', raw );

		const window = globalThis as any;

		beforeEach( () => {
			nested = { b: 2 };
			array = [ 3, nested ];
			raw = { a: 1, nested, array };
			state = proxifyState( 'test', raw );
		} );

		describe( 'get', () => {
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
				const state = proxifyState( 'test', {
					counter: 1,
					get double() {
						return state.counter * 2;
					},
				} );
				expect( state.double ).toBe( 2 );
				state.counter = 2;
				expect( state.double ).toBe( 4 );
			} );

			it( 'should support getters returning other parts of the state', () => {
				const state = proxifyState( 'test', {
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
				const state = proxifyState( 'test', {
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
				const state = proxifyState( 'test', {
					get y() {
						const ctx = getContext< { value: string } >();
						return ctx.value;
					},
				} );

				const scope = { context: { test: { value: 'from context' } } };
				try {
					setScope( scope as any );
					expect( state.y ).toBe( 'from context' );
				} finally {
					resetScope();
				}
			} );

			it( 'should use its namespace by default inside getters', () => {
				const state = proxifyState( 'test/right', {
					get value() {
						const ctx = getContext< { value: string } >();
						return ctx.value;
					},
				} );

				const scope = {
					context: {
						'test/right': { value: 'OK' },
						'test/other': { value: 'Wrong' },
					},
				};

				try {
					setScope( scope as any );
					setNamespace( 'test/other' );
					expect( state.value ).toBe( 'OK' );
				} finally {
					resetNamespace();
					resetScope();
				}
			} );

			it( 'should work with normal functions', () => {
				const state = proxifyState( 'test', {
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
				const state = proxifyState( 'test', {
					sumContextValue( newValue: number ): number {
						const ctx = getContext< { value: number } >();
						return ctx.value + newValue;
					},
				} );

				const scope = { context: { test: { value: 1 } } };
				try {
					setScope( scope as any );
					expect( state.sumContextValue( 2 ) ).toBe( 3 );
				} finally {
					resetScope();
				}
			} );

			it( 'should allow using `this` inside functions', () => {
				const state = proxifyState( 'test', {
					value: 1,
					sum( newValue: number ): number {
						return this.value + newValue;
					},
				} );
				expect( state.sum( 2 ) ).toBe( 3 );
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
				const state = proxifyState( 'test', {
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

			it( 'should support setting getters on the fly', () => {
				const state = proxifyState< {
					counter: number;
					double?: number;
				} >( 'test', {
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

			it( 'should support getter modification', () => {
				const state = proxifyState< {
					counter: number;
					double: number;
				} >( 'test', {
					counter: 1,
					get double() {
						return state.counter * 2;
					},
				} );

				const scope = {
					context: { test: { counter: 2 } },
				};

				expect( state.double ).toBe( 2 );

				Object.defineProperty( state, 'double', {
					get() {
						const ctx = getContext< { counter: number } >();
						return ctx.counter * 2;
					},
				} );

				try {
					setScope( scope as any );
					expect( state.double ).toBe( 4 );
				} finally {
					resetScope();
				}
			} );

			it( 'should copy object like plain JavaScript', () => {
				const state = proxifyState< {
					a?: { id: number; nested: { id: number } };
					b: { id: number; nested: { id: number } };
				} >( 'test', {
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
				const state1 = proxifyState( 'test-1', raw1 );
				const state2 = proxifyState( 'test-2', raw2 );
				state2.obj = state1.obj;
				expect( state2.obj ).toBe( state1.obj );
				expect( raw2.obj ).toBe( state1.obj );
			} );

			it( 'should use its namespace by default inside setters', () => {
				const state = proxifyState( 'test/right', {
					set counter( val: number ) {
						const ctx = getContext< { counter: number } >();
						ctx.counter = val;
					},
				} );

				const scope = {
					context: {
						'test/other': { counter: 0 },
						'test/right': { counter: 0 },
					},
				};

				try {
					setScope( scope as any );
					setNamespace( 'test/other' );
					state.counter = 4;
					expect( scope.context[ 'test/right' ].counter ).toBe( 4 );
				} finally {
					resetNamespace();
					resetScope();
				}
			} );
		} );

		describe( 'computations', () => {
			it( 'should subscribe to values mutated with setters', () => {
				const state = proxifyState( 'test', {
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
				const state = proxifyState( 'test', [ 0, 0, 0 ] );
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
				const state = proxifyState( 'test', raw );
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
				const state = proxifyState( 'test', raw );
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
				const state = proxifyState( 'test', raw );
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
				const state = proxifyState( 'test', [ 0, 0 ] );
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
				const state = proxifyState( 'test', [ 'foo', 'bar' ] );
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

				const state = proxifyState< {
					a?: { id: number; nested: { id: number } };
					b: { id: number; nested: { id: number } }[];
				} >( 'test', {
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
				const state = proxifyState( 'test', {
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
				const state = proxifyState( 'test', {
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
					() =>
						typeof state.array[ 1 ] === 'object' &&
						state.array[ 1 ].b
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
				const state = proxifyState( 'test', { array } );
				const spy1 = jest.fn( () => state.array.length );
				const spy2 = jest.fn( () =>
					state.array.map( ( i: number ) => i )
				);

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
				const state = proxifyState( 'test', {
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

			it( 'should keep subscribed to modified getters', () => {
				const state = proxifyState< {
					counter: number;
					double: number;
				} >( 'test', {
					counter: 1,
					get double() {
						return state.counter * 2;
					},
				} );

				const scope = {
					context: { test: { counter: 2 } },
				};

				let double = 0;

				effect(
					withScopeAndNs( scope, 'test', () => {
						double = state.double;
					} )
				);

				expect( double ).toBe( 2 );

				Object.defineProperty( state, 'double', {
					get() {
						const ctx = getContext< { counter: number } >();
						return ctx.counter * 2;
					},
				} );

				expect( double ).toBe( 4 );
			} );

			it( 'should react to changes in props inside getters', () => {
				const state = proxifyState( 'test', {
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

			it( 'should react to changes in props inside getters if they become getters', () => {
				const state = proxifyState( 'test', {
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
				const state = proxifyState( 'test', {
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
				const state = proxifyState( 'test', {
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

			it( 'should throw an error in getters that require a scope', () => {
				const state = proxifyState( 'test', {
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

			it( 'should react to changes in props inside functions', () => {
				const state = proxifyState( 'test', {
					number: 1,
					otherNumber: 3,
					sum( value: number ) {
						return state.number + state.otherNumber + value;
					},
				} );

				let result = 0;

				effect( () => {
					result = state.sum( 2 );
				} );

				expect( result ).toBe( 6 );
				state.number = 2;
				expect( result ).toBe( 7 );
				state.otherNumber = 4;
				expect( result ).toBe( 8 );
			} );
		} );

		describe( 'peek', () => {
			it( 'should return correct values when using peek()', () => {
				expect( peek( state, 'a' ) ).toBe( 1 );
				expect( peek( state.nested, 'b' ) ).toBe( 2 );
				expect( peek( state.array, 0 ) ).toBe( 3 );
				const nested = peek( state, 'array' )[ 1 ];
				expect( typeof nested === 'object' && nested.b ).toBe( 2 );
				expect( peek( state.array, 'length' ) ).toBe( 2 );
			} );

			it( 'should not subscribe to changes when peeking', () => {
				const spy1 = jest.fn( () => peek( state, 'a' ) );
				const spy2 = jest.fn( () => peek( state, 'nested' ) );
				const spy3 = jest.fn( () => peek( state, 'nested' ).b );
				const spy4 = jest.fn( () => peek( state, 'array' )[ 0 ] );
				const spy5 = jest.fn( () => {
					const nested = peek( state, 'array' )[ 1 ];
					return typeof nested === 'object' && nested.b;
				} );
				const spy6 = jest.fn( () => peek( state, 'array' ).length );

				effect( spy1 );
				effect( spy2 );
				effect( spy3 );
				effect( spy4 );
				effect( spy5 );
				effect( spy6 );

				expect( spy1 ).toHaveBeenCalledTimes( 1 );
				expect( spy2 ).toHaveBeenCalledTimes( 1 );
				expect( spy3 ).toHaveBeenCalledTimes( 1 );
				expect( spy4 ).toHaveBeenCalledTimes( 1 );
				expect( spy5 ).toHaveBeenCalledTimes( 1 );
				expect( spy6 ).toHaveBeenCalledTimes( 1 );

				state.a = 11;
				state.nested.b = 22;
				state.nested = { b: 222 };
				state.array[ 0 ] = 33;
				if ( typeof state.array[ 1 ] === 'object' ) {
					state.array[ 1 ].b = 2222;
				}
				state.array.push( 4 );

				expect( spy1 ).toHaveBeenCalledTimes( 1 );
				expect( spy2 ).toHaveBeenCalledTimes( 1 );
				expect( spy3 ).toHaveBeenCalledTimes( 1 );
				expect( spy4 ).toHaveBeenCalledTimes( 1 );
				expect( spy5 ).toHaveBeenCalledTimes( 1 );
				expect( spy6 ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'should subscribe to some changes but not other when peeking inside an object', () => {
				const spy1 = jest.fn( () => peek( state.nested, 'b' ) );
				effect( spy1 );
				expect( spy1 ).toHaveBeenCalledTimes( 1 );
				state.nested.b = 22;
				expect( spy1 ).toHaveBeenCalledTimes( 1 );
				state.nested = { b: 222 };
				expect( spy1 ).toHaveBeenCalledTimes( 2 );
				state.nested.b = 2222;
				expect( spy1 ).toHaveBeenCalledTimes( 2 );
			} );

			it( 'should support returning peek from getters', () => {
				const state = proxifyState( 'test', {
					counter: 1,
					get double() {
						return state.counter * 2;
					},
				} );
				expect( peek( state, 'double' ) ).toBe( 2 );
				state.counter = 2;
				expect( peek( state, 'double' ) ).toBe( 4 );
			} );

			it( 'should support peeking getters accessing the scope', () => {
				const state = proxifyState( 'test', {
					get double() {
						const { counter } = getContext< { counter: number } >();
						return counter * 2;
					},
				} );

				const context = proxifyState( 'test', { counter: 1 } );
				const scope = { context: { test: context } };
				const peekStateDouble = withScopeAndNs( scope, 'test', () =>
					peek( state, 'double' )
				);

				const spy = jest.fn( peekStateDouble );
				effect( spy );
				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( peekStateDouble() ).toBe( 2 );

				context.counter = 2;

				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( peekStateDouble() ).toBe( 4 );
			} );

			it( 'should support peeking getters accessing other namespaces', () => {
				const state2 = proxifyState( 'test2', {
					get counter() {
						const { counter } = getContext< { counter: number } >();
						return counter;
					},
				} );
				const context2 = proxifyState( 'test-2', { counter: 1 } );

				const state1 = proxifyState( 'test1', {
					get double() {
						return state2.counter * 2;
					},
				} );

				const peekStateDouble = withScopeAndNs(
					{ context: { test2: context2 } },
					'test2',
					() => peek( state1, 'double' )
				);

				const spy = jest.fn( peekStateDouble );
				effect( spy );
				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( peekStateDouble() ).toBe( 2 );

				context2.counter = 2;

				expect( spy ).toHaveBeenCalledTimes( 1 );
				expect( peekStateDouble() ).toBe( 4 );
			} );
		} );

		describe( 'refs', () => {
			it( 'should preserve object references', () => {
				expect( state.nested ).toBe( state.array[ 1 ] );

				state.nested.b = 22;

				expect( state.nested ).toBe( state.array[ 1 ] );
				expect( state.nested.b ).toBe( 22 );
				expect(
					typeof state.array[ 1 ] === 'object' && state.array[ 1 ].b
				).toBe( 22 );

				state.nested = { b: 222 };

				expect( state.nested ).not.toBe( state.array[ 1 ] );
				expect( state.nested.b ).toBe( 222 );
				expect(
					typeof state.array[ 1 ] === 'object' && state.array[ 1 ].b
				).toBe( 22 );
			} );

			it( 'should return the same proxy if initialized more than once', () => {
				const raw = {};
				const state1 = proxifyState( 'test', raw );
				const state2 = proxifyState( 'test', raw );
				expect( state1 ).toBe( state2 );
			} );

			it( 'should throw when trying to re-proxify a state object', () => {
				const state = proxifyState( 'test', {} );
				expect( () => proxifyState( 'test', state ) ).toThrow();
			} );
		} );

		describe( 'unsupported data structures', () => {
			it( 'should throw when trying to proxify a class instance', () => {
				class MyClass {}
				const obj = new MyClass();
				expect( () => proxifyState( 'test', obj ) ).toThrow();
			} );

			it( 'should not wrap a class instance', () => {
				class MyClass {}
				const obj = new MyClass();
				const state = proxifyState( 'test', { obj } );
				expect( state.obj ).toBe( obj );
			} );

			it( 'should not wrap built-ins in proxies', () => {
				window.MyClass = class MyClass {};
				const obj = new window.MyClass();
				const state = proxifyState( 'test', { obj } );
				expect( state.obj ).toBe( obj );
			} );

			it( 'should not wrap elements in proxies', () => {
				const el = window.document.createElement( 'div' );
				const state = proxifyState( 'test', { el } );
				expect( state.el ).toBe( el );
			} );

			it( 'should wrap global objects', () => {
				window.obj = { b: 2 };
				const state = proxifyState( 'test', window.obj );
				expect( state ).not.toBe( window.obj );
				expect( state ).toStrictEqual( { b: 2 } );
			} );

			it( 'should not wrap dates', () => {
				const date = new Date();
				const state = proxifyState( 'test', { date } );
				expect( state.date ).toBe( date );
			} );

			it( 'should not wrap regular expressions', () => {
				const regex = new RegExp( '' );
				const state = proxifyState( 'test', { regex } );
				expect( state.regex ).toBe( regex );
			} );

			it( 'should not wrap Map', () => {
				const map = new Map();
				const state = proxifyState( 'test', { map } );
				expect( state.map ).toBe( map );
			} );

			it( 'should not wrap Set', () => {
				const set = new Set();
				const state = proxifyState( 'test', { set } );
				expect( state.set ).toBe( set );
			} );
		} );

		describe( 'symbols', () => {
			it( 'should observe symbols', () => {
				const key = Symbol( 'key' );
				let x;
				const store = proxifyState< { [ key: symbol ]: any } >(
					'test',
					{}
				);
				effect( () => ( x = store[ key ] ) );

				expect( store[ key ] ).toBe( undefined );
				expect( x ).toBe( undefined );

				store[ key ] = true;

				expect( store[ key ] ).toBe( true );
				expect( x ).toBe( true );
			} );

			it( 'should not observe well-known symbols', () => {
				const key = Symbol.isConcatSpreadable;
				let x;
				const state = proxifyState< { [ key: symbol ]: any } >(
					'test',
					{}
				);
				effect( () => ( x = state[ key ] ) );

				expect( state[ key ] ).toBe( undefined );
				expect( x ).toBe( undefined );

				state[ key ] = true;
				expect( state[ key ] ).toBe( true );
				expect( x ).toBe( undefined );
			} );
		} );

		describe( 'read-only', () => {
			it( "should not allow modifying a prop's value", () => {
				const readOnlyState = proxifyState(
					'test',
					{ prop: 'value', nested: { prop: 'value' } },
					{ readOnly: true }
				);

				expect( () => {
					readOnlyState.prop = 'new value';
				} ).toThrow();
				expect( () => {
					readOnlyState.nested.prop = 'new value';
				} ).toThrow();
			} );

			it( 'should not allow modifying a prop descriptor', () => {
				const readOnlyState = proxifyState(
					'test',
					{ prop: 'value', nested: { prop: 'value' } },
					{ readOnly: true }
				);

				expect( () => {
					Object.defineProperty( readOnlyState, 'prop', {
						get: () => 'value from getter',
						writable: true,
						enumerable: false,
					} );
				} ).toThrow();
				expect( () => {
					Object.defineProperty( readOnlyState.nested, 'prop', {
						get: () => 'value from getter',
						writable: true,
						enumerable: false,
					} );
				} ).toThrow();
			} );

			it( 'should not allow adding new props', () => {
				const readOnlyState = proxifyState< any >(
					'test',
					{ prop: 'value', nested: { prop: 'value' } },
					{ readOnly: true }
				);

				expect( () => {
					readOnlyState.newProp = 'value';
				} ).toThrow();
				expect( () => {
					readOnlyState.nested.newProp = 'value';
				} ).toThrow();
			} );

			it( 'should not allow removing props', () => {
				const readOnlyState = proxifyState< any >(
					'test',
					{ prop: 'value', nested: { prop: 'value' } },
					{ readOnly: true }
				);

				expect( () => {
					delete readOnlyState.prop;
				} ).toThrow();
				expect( () => {
					delete readOnlyState.nested.prop;
				} ).toThrow();
			} );

			it( 'should not allow adding items to an array', () => {
				const readOnlyState = proxifyState(
					'test',
					{ array: [ 1, 2, 3 ], nested: { array: [ 1, 2, 3 ] } },
					{ readOnly: true }
				);

				expect( () => readOnlyState.array.push( 4 ) ).toThrow();
				expect( () => readOnlyState.nested.array.push( 4 ) ).toThrow();
			} );

			it( 'should not allow removing items from an array', () => {
				const readOnlyState = proxifyState(
					'test',
					{ array: [ 1, 2, 3 ], nested: { array: [ 1, 2, 3 ] } },
					{ readOnly: true }
				);

				expect( () => readOnlyState.array.pop() ).toThrow();
				expect( () => readOnlyState.nested.array.pop() ).toThrow();
			} );

			it( 'should allow subscribing to prop changes', () => {
				const readOnlyState = proxifyState(
					'test',
					{
						prop: 'value',
						nested: { prop: 'value' },
					},
					{ readOnly: true }
				);

				const spy1 = jest.fn( () => readOnlyState.prop );
				const spy2 = jest.fn( () => readOnlyState.nested.prop );

				effect( spy1 );
				effect( spy2 );
				expect( spy1 ).toHaveBeenCalledTimes( 1 );
				expect( spy2 ).toHaveBeenCalledTimes( 1 );
				expect( spy1 ).toHaveLastReturnedWith( 'value' );
				expect( spy2 ).toHaveLastReturnedWith( 'value' );

				deepMerge( readOnlyState, { prop: 'new value' } );

				expect( spy1 ).toHaveBeenCalledTimes( 2 );
				expect( spy2 ).toHaveBeenCalledTimes( 1 );
				expect( spy1 ).toHaveLastReturnedWith( 'new value' );
				expect( spy2 ).toHaveLastReturnedWith( 'value' );

				deepMerge( readOnlyState, { nested: { prop: 'new value' } } );

				expect( spy1 ).toHaveBeenCalledTimes( 2 );
				expect( spy2 ).toHaveBeenCalledTimes( 2 );
				expect( spy1 ).toHaveLastReturnedWith( 'new value' );
				expect( spy2 ).toHaveLastReturnedWith( 'new value' );
			} );

			it( 'should allow subscribing to new props', () => {
				const readOnlyState = proxifyState< any >(
					'test',
					{
						prop: 'value',
						nested: { prop: 'value' },
					},
					{ readOnly: true }
				);

				const spy1 = jest.fn( () => readOnlyState.newProp );
				const spy2 = jest.fn( () => readOnlyState.nested.newProp );

				effect( spy1 );
				effect( spy2 );
				expect( spy1 ).toHaveBeenCalledTimes( 1 );
				expect( spy2 ).toHaveBeenCalledTimes( 1 );
				expect( spy1 ).toHaveLastReturnedWith( undefined );
				expect( spy2 ).toHaveLastReturnedWith( undefined );

				deepMerge( readOnlyState, { newProp: 'value' } );

				expect( spy1 ).toHaveBeenCalledTimes( 2 );
				expect( spy2 ).toHaveBeenCalledTimes( 1 );
				expect( spy1 ).toHaveLastReturnedWith( 'value' );
				expect( spy2 ).toHaveLastReturnedWith( undefined );

				deepMerge( readOnlyState, { nested: { newProp: 'value' } } );

				expect( spy1 ).toHaveBeenCalledTimes( 2 );
				expect( spy2 ).toHaveBeenCalledTimes( 2 );
				expect( spy1 ).toHaveLastReturnedWith( 'value' );
				expect( spy2 ).toHaveLastReturnedWith( 'value' );
			} );

			it( 'should allow subscribing to array changes', () => {
				const readOnlyState = proxifyState< any >(
					'test',
					{
						array: [ 1, 2, 3 ],
						nested: { array: [ 1, 2, 3 ] },
					},
					{ readOnly: true }
				);

				const spy1 = jest.fn( () => readOnlyState.array[ 0 ] );
				const spy2 = jest.fn( () => readOnlyState.nested.array[ 0 ] );

				effect( spy1 );
				effect( spy2 );
				expect( spy1 ).toHaveBeenCalledTimes( 1 );
				expect( spy2 ).toHaveBeenCalledTimes( 1 );
				expect( spy1 ).toHaveLastReturnedWith( 1 );
				expect( spy2 ).toHaveLastReturnedWith( 1 );

				deepMerge( readOnlyState, { array: [ 4, 5, 6 ] } );

				expect( spy1 ).toHaveBeenCalledTimes( 2 );
				expect( spy2 ).toHaveBeenCalledTimes( 1 );
				expect( spy1 ).toHaveLastReturnedWith( 4 );
				expect( spy2 ).toHaveLastReturnedWith( 1 );

				deepMerge( readOnlyState, { nested: { array: [] } } );

				expect( spy1 ).toHaveBeenCalledTimes( 2 );
				expect( spy2 ).toHaveBeenCalledTimes( 2 );
				expect( spy1 ).toHaveLastReturnedWith( 4 );
				expect( spy2 ).toHaveLastReturnedWith( undefined );
			} );
		} );
	} );
} );
