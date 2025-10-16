/**
 * Internal dependencies
 */
import { getServerContext } from '../scopes';
import {
	store,
	getServerState,
	type AsyncAction,
	type TypeYield,
} from '../store';

describe( 'Interactivity API types', () => {
	it( 'dummy test', () => {
		expect( true ).toBe( true );
	} );

	describe( 'store', () => {
		describe( 'the whole store can be inferred', () => {
			// eslint-disable-next-line no-unused-expressions
			async () => {
				const myStore = store( 'test', {
					state: {
						clientValue: 1,
						get derived(): number {
							return myStore.state.clientValue;
						},
					},
					actions: {
						sync( n: number ) {
							return n;
						},
						*async( n: number ) {
							const n1: number = yield myStore.actions.sync( n );
							return myStore.state.derived + n1 + n;
						},
					},
				} );

				myStore.state.clientValue satisfies number;
				myStore.state.derived satisfies number;

				// @ts-expect-error
				myStore.state.nonExistent satisfies number;
				myStore.actions.sync( 1 ) satisfies number;
				myStore.actions.async( 1 ) satisfies Promise< number >;
				( await myStore.actions.async( 1 ) ) satisfies number;

				// @ts-expect-error
				myStore.actions.nonExistent() satisfies {};
			};
		} );

		describe( 'the whole store can be manually typed', () => {
			// eslint-disable-next-line no-unused-expressions
			async () => {
				interface Store {
					state: {
						clientValue: number;
						serverValue: number;
						readonly derived: number;
					};
					actions: {
						sync: ( n: number ) => number;
						async: ( n: number ) => Promise< number >;
					};
				}

				const myStore = store< Store >( 'test', {
					state: {
						clientValue: 1,
						// @ts-expect-error
						nonExistent: 2,
						get derived(): number {
							return myStore.state.serverValue;
						},
					},
					actions: {
						sync( n ) {
							return n;
						},
						*async( n ): AsyncAction< number > {
							const n1 = myStore.actions.sync( n );
							return myStore.state.derived + n1 + n;
						},
					},
				} );

				myStore.state.clientValue satisfies number;
				myStore.state.serverValue satisfies number;
				myStore.state.derived satisfies number;
				// @ts-expect-error
				myStore.state.nonExistent satisfies number;
				myStore.actions.sync( 1 ) satisfies number;
				myStore.actions.async( 1 ) satisfies Promise< number >;
				( await myStore.actions.async( 1 ) ) satisfies number;
				// @ts-expect-error
				myStore.actions.nonExistent();
			};
		} );

		describe( 'the server state can be typed and the rest inferred', () => {
			// eslint-disable-next-line no-unused-expressions
			async () => {
				type ServerStore = {
					state: {
						serverValue: number;
					};
				};

				const clientStore = {
					state: {
						clientValue: 1,
						get derived(): number {
							return myStore.state.serverValue;
						},
					},
					actions: {
						sync( n: number ) {
							return n;
						},
						*async( n: number ): AsyncAction< number > {
							const n1 = ( yield myStore.actions.async2(
								n
							) ) as TypeYield<
								typeof myStore.actions.async2
							> satisfies number;
							return myStore.state.derived + n1 + n;
						},
						*async2( n: number ) {
							return n;
						},
					},
				};

				type Store = ServerStore & typeof clientStore;

				const myStore = store< Store >( 'test', clientStore );

				myStore.state.clientValue satisfies number;
				myStore.state.serverValue satisfies number;
				myStore.state.derived satisfies number;
				// @ts-expect-error
				myStore.state.nonExistent satisfies number;
				myStore.actions.sync( 1 ) satisfies number;
				myStore.actions.async( 1 ) satisfies Promise< number >;
				( await myStore.actions.async( 1 ) ) satisfies number;
				// @ts-expect-error
				myStore.actions.nonExistent();
			};
		} );

		describe( 'the state can be casted and the rest inferred', () => {
			// eslint-disable-next-line no-unused-expressions
			async () => {
				type State = {
					clientValue: number;
					serverValue: number;
					derived: number;
				};

				const myStore = store( 'test', {
					state: {
						clientValue: 1,
						get derived(): number {
							return myStore.state.serverValue;
						},
					} as State,
					actions: {
						sync( n: number ) {
							return n;
						},
						*async( n: number ): AsyncAction< number > {
							const n1 = ( yield myStore.actions.async2(
								n
							) ) as TypeYield<
								typeof myStore.actions.async2
							> satisfies number;
							return myStore.state.derived + n1 + n;
						},
						*async2( n: number ) {
							return n;
						},
					},
				} );

				myStore.state.clientValue satisfies number;
				myStore.state.serverValue satisfies number;
				myStore.state.derived satisfies number;
				// @ts-expect-error
				myStore.state.nonExistent satisfies number;
				myStore.actions.sync( 1 ) satisfies number;
				myStore.actions.async( 1 ) satisfies Promise< number >;
				( await myStore.actions.async( 1 ) ) satisfies number;
				// @ts-expect-error
				myStore.actions.nonExistent() satisfies {};
			};
		} );

		describe( 'the whole store can be manually typed even if doesnt contain state', () => {
			// eslint-disable-next-line no-unused-expressions
			async () => {
				interface Store {
					actions: {
						sync: ( n: number ) => number;
						async: ( n: number ) => Promise< number >;
						async2: ( n: number ) => AsyncAction< number >;
					};
					callbacks: {
						existent: number;
					};
				}

				const myStore = store< Store >( 'test', {
					actions: {
						sync( n ) {
							return n;
						},
						*async( n ): AsyncAction< number > {
							const n1 = ( yield myStore.actions.async2(
								n
							) ) as TypeYield<
								typeof myStore.actions.async2
							> satisfies number;
							return n1 + n;
						},
						*async2( n: number ) {
							return n;
						},
					},
					callbacks: {
						existent: 1,
						// @ts-expect-error
						nonExistent: 1,
					},
				} );

				// @ts-expect-error
				myStore.state.nonExistent satisfies number;
				myStore.actions.sync( 1 ) satisfies number;
				myStore.actions.async( 1 ) satisfies Promise< number >;
				( await myStore.actions.async( 1 ) ) satisfies number;
				myStore.callbacks.existent satisfies number;
				// @ts-expect-error
				myStore.callbacks.nonExistent satisfies number;
				// @ts-expect-error
				myStore.actions.nonExistent() satisfies {};
			};
		} );

		describe( 'the store can be divided into multiple parts', () => {
			// eslint-disable-next-line no-unused-expressions
			async () => {
				type ServerState = {
					state: {
						serverValue: number;
					};
				};

				const firstStorePart = {
					state: {
						clientValue1: 1,
					},
					actions: {
						incrementValue1( n = 1 ) {
							myStore.state.clientValue1 += n;
						},
					},
				};

				type FirstStorePart = typeof firstStorePart;

				const secondStorePart = {
					state: {
						clientValue2: 'test',
					},
					actions: {
						*asyncAction() {
							return (
								myStore.state.clientValue1 +
								myStore.state.serverValue
							);
						},
					},
				};

				type Store = ServerState &
					FirstStorePart &
					typeof secondStorePart;

				const myStore = store< Store >( 'test', firstStorePart );
				store( 'test', secondStorePart );

				myStore.state.clientValue1 satisfies number;
				myStore.state.clientValue2 satisfies string;
				myStore.actions.incrementValue1( 1 );
				myStore.actions.asyncAction() satisfies Promise< number >;
				( await myStore.actions.asyncAction() ) satisfies number;

				// @ts-expect-error
				myStore.state.nonExistent satisfies {};
			};
		} );

		describe( 'a typed store can be returned without adding a new store part', () => {
			type State = {
				someValue: number;
			};
			type Actions = {
				incrementValue: ( n: number ) => void;
			};

			const { state, actions } = store< {
				state: State;
				actions: Actions;
			} >( 'storeWithState', {
				actions: {
					incrementValue( n ) {
						state.someValue += n;
					},
				},
			} );

			state.someValue satisfies number;
			actions.incrementValue( 1 ) satisfies void;

			const { actions: actions2 } = store< { actions: Actions } >(
				'storeWithoutState',
				{
					actions: {
						incrementValue( n ) {
							state.someValue += n;
						},
					},
				}
			);

			actions2.incrementValue( 1 ) satisfies void;
		} );

		describe( 'async actions can pass state to yields and type the yield returns', () => {
			// eslint-disable-next-line no-unused-expressions
			async () => {
				type Store = {
					state: {
						someValue: string;
					};
					actions: {
						asyncAction: () => Promise< number >;
					};
				};

				const asyncFunction = async (
					someValue: string
				): Promise< string > => {
					return someValue;
				};

				const { state, actions } = store< Store >( 'test', {
					actions: {
						*asyncAction(): AsyncAction< number > {
							( yield asyncFunction(
								state.someValue
							) ) as TypeYield<
								typeof asyncFunction
							> satisfies string;

							return 1;
						},
					},
				} );

				( await actions.asyncAction() ) satisfies number;
			};
		} );
	} );

	describe( 'getServerState', () => {
		describe( 'should return a read-only generic object when no type is passed', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const state = getServerState();
				// @ts-expect-error
				state.nonModifiable = 'error';
				state.nonExistent satisfies any;
			};
		} );

		describe( 'should accept a type parameter to define the returned object type, but convert it to read-only', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				interface State {
					foo: string;
					bar: {
						baz: number;
					};
				}
				const state = getServerState< State >();
				// @ts-expect-error
				state.nonExistent = 'error';
				// @ts-expect-error
				state.foo = 'error';
				// @ts-expect-error
				state.bar.baz = 1;
				state.foo satisfies string;
				state.bar.baz satisfies number;
			};
		} );
	} );

	describe( 'getServerContext', () => {
		describe( 'should return a read-only generic object when no type is passed', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const context = getServerContext();
				// @ts-expect-error
				context.nonModifiable = 'error';
				context.nonExistent satisfies any;
			};
		} );

		describe( 'should accept a type parameter to define the returned object type, but convert it to read-only', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				interface Context {
					foo: string;
					bar: {
						baz: number;
					};
				}
				const context = getServerContext< Context >();
				// @ts-expect-error
				context.nonExistent = 'error';
				// @ts-expect-error
				context.foo = 'error';
				// @ts-expect-error
				context.bar.baz = 1;
				context.foo satisfies string;
				context.bar.baz satisfies number;
			};
		} );
	} );
} );
