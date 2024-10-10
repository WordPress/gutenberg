/**
 * Internal dependencies
 */
import { store } from '../store';

describe( 'Interactivity API', () => {
	describe( 'store', () => {
		it( 'dummy test', () => {
			expect( true ).toBe( true );
		} );

		describe( 'types', () => {
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
								const n1: number =
									yield myStore.actions.sync( n );
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
							*async( n ): Generator< unknown, number, unknown > {
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
							*async(
								n: number
							): Generator< unknown, number, number > {
								const n1: number =
									yield myStore.actions.sync( n );
								return myStore.state.derived + n1 + n;
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
							*async(
								n: number
							): Generator< unknown, number, number > {
								const n1: number =
									yield myStore.actions.sync( n );
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
							*async( n ): Generator< unknown, number, number > {
								const n1: number =
									yield myStore.actions.sync( n );
								return n1 + n;
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
		} );
	} );
} );
