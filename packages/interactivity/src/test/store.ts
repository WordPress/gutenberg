/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */

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

					const n1: number = myStore.state.clientValue;
					const n2: number = myStore.state.derived;
					// @ts-expect-error
					const n3: number = myStore.state.nonExistent;
					const n4: number = myStore.actions.sync( 1 );
					const n5: Promise< number > = myStore.actions.async( 1 );
					const n6: number = await myStore.actions.async( 1 );
					// @ts-expect-error
					myStore.actions.nonExistent();
				};
			} );

			describe( 'the whole store can be manually typed', () => {
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
							get derived(): number {
								return myStore.state.serverValue;
							},
						},
						actions: {
							sync( n ) {
								return n;
							},
							*async( n ): Generator< unknown, number, number > {
								const n1: number =
									yield myStore.actions.sync( n );
								return myStore.state.derived + n1 + n;
							},
						},
					} );

					const n1: number = myStore.state.clientValue;
					const n2: number = myStore.state.serverValue;
					const n3: number = myStore.state.derived;
					// @ts-expect-error
					const n4: number = myStore.state.nonExistent;
					const n5: number = myStore.actions.sync( 1 );
					const n6: Promise< number > = myStore.actions.async( 1 );
					const n7: number = await myStore.actions.async( 1 );
					// @ts-expect-error
					myStore.actions.nonExistent();
				};
			} );

			describe( 'the server state can be typed and the rest inferred', () => {
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

					const n1: number = myStore.state.clientValue;
					const n2: number = myStore.state.serverValue;
					const n3: number = myStore.state.derived;
					// @ts-expect-error
					const n4: number = myStore.state.nonExistent;
					const n5: number = myStore.actions.sync( 1 );
					const n6: Promise< number > = myStore.actions.async( 1 );
					const n7: number = await myStore.actions.async( 1 );
					// @ts-expect-error
					myStore.actions.nonExistent();
				};
			} );

			describe( 'the whole store can be manually typed even if doesnt contain state', () => {
				async () => {
					interface Store {
						actions: {
							sync: ( n: number ) => number;
							async: ( n: number ) => Promise< number >;
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
					} );

					// @ts-expect-error
					const n1: number = myStore.state.nonExistent;
					const n2: number = myStore.actions.sync( 1 );
					const n3: Promise< number > = myStore.actions.async( 1 );
					const n4: number = await myStore.actions.async( 1 );
					// @ts-expect-error
					myStore.actions.nonExistent();
				};
			} );
		} );
	} );
} );
