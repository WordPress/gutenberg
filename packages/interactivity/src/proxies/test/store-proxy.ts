/**
 * Internal dependencies
 */
import { proxifyStore, proxifyState } from '../';
import { setScope, resetScope, getContext } from '../../scopes';
import { setNamespace, resetNamespace } from '../../namespaces';

describe( 'Interactivity API', () => {
	describe( 'store proxy', () => {
		describe( 'get', () => {
			it( 'should initialize properties at the top level if they do not exist', () => {
				const store = proxifyStore< any >( 'test', {} );
				expect( store.state.props ).toBeUndefined();
				expect( store.state ).toEqual( {} );
			} );

			it( 'should wrap sync functions with the store namespace and current scope', () => {
				let result = '';

				const syncFunc = () => {
					const ctx = getContext< { value: string } >();
					result = ctx.value;
				};

				const storeTest = proxifyStore( 'test', {
					callbacks: {
						syncFunc,
						nested: { syncFunc },
					},
				} );

				const scope = {
					context: {
						test: { value: 'test' },
					},
				};

				setNamespace( 'other-namespace' );
				setScope( scope as any );

				storeTest.callbacks.syncFunc();
				expect( result ).toBe( 'test' );
				storeTest.callbacks.nested.syncFunc();
				expect( result ).toBe( 'test' );

				resetScope();
				resetNamespace();
			} );

			it( 'should wrap generators into async functions', async () => {
				const asyncFunc = function* () {
					const data = yield Promise.resolve( 'data' );
					const ctx = getContext< { value: string } >();
					return `${ data } from ${ ctx.value }`;
				};

				const storeTest = proxifyStore( 'test', {
					callbacks: { asyncFunc, nested: { asyncFunc } },
				} );

				const scope = {
					context: {
						test: { value: 'test' },
					},
				};

				setNamespace( 'other-namespace' );
				setScope( scope as any );
				const promise1 = storeTest.callbacks.asyncFunc();
				const promise2 = storeTest.callbacks.nested.asyncFunc();
				resetScope();
				resetNamespace();

				expect( await promise1 ).toBe( 'data from test' );
				expect( await promise2 ).toBe( 'data from test' );
			} );

			it( 'should allow async functions to call functions from other stores', async () => {
				const asyncFunc = function* () {
					const data = yield Promise.resolve( 'data' );
					const ctx = getContext< { value: string } >();
					return `${ data } from ${ ctx.value }`;
				};

				const storeTest1 = proxifyStore( 'test1', {
					callbacks: { asyncFunc },
				} );

				const storeTest2 = proxifyStore( 'test2', {
					callbacks: {
						*asyncFunc() {
							const result =
								yield storeTest1.callbacks.asyncFunc();
							return result;
						},
					},
				} );

				const scope = {
					context: {
						test1: { value: 'test1' },
						test2: { value: 'test2' },
					},
				};

				setNamespace( 'other-namespace' );
				setScope( scope as any );
				const promise = storeTest2.callbacks.asyncFunc();
				resetScope();
				resetNamespace();

				expect( await promise ).toBe( 'data from test1' );
			} );

			it( 'should not wrap other proxified objects with a store proxy', () => {
				const state = proxifyState( 'test', {} );
				const store = proxifyStore( 'test', { state } );

				expect( store.state ).toBe( state );
			} );
		} );
	} );
} );
