/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	createRegistry,
	createReduxStore,
	useSuspenseSelect,
	RegistryProvider,
} from '@wordpress/data';
import { Component, Suspense } from '@wordpress/element';

function createRegistryWithStore() {
	const initialState = {
		prefix: 'pre-',
		token: null,
		data: null,
		fails: true,
	};

	const reducer = ( state = initialState, action ) => {
		switch ( action.type ) {
			case 'RECEIVE_TOKEN':
				return { ...state, token: action.token };
			case 'RECEIVE_DATA':
				return { ...state, data: action.data };
			default:
				return state;
		}
	};

	const selectors = {
		getPrefix: ( state ) => state.prefix,
		getToken: ( state ) => state.token,
		getData: ( state, token ) => {
			if ( ! token ) {
				throw 'missing token in selector';
			}
			return state.data;
		},
		getThatFails: ( state ) => state.fails,
	};

	const sleep = ( ms ) => new Promise( ( r ) => setTimeout( () => r(), ms ) );

	const resolvers = {
		getToken:
			() =>
			async ( { dispatch } ) => {
				await sleep( 10 );
				dispatch( { type: 'RECEIVE_TOKEN', token: 'token' } );
			},
		getData:
			( token ) =>
			async ( { dispatch } ) => {
				await sleep( 10 );
				if ( ! token ) {
					throw 'missing token in resolver';
				}
				dispatch( { type: 'RECEIVE_DATA', data: 'therealdata' } );
			},
		getThatFails: () => async () => {
			await sleep( 10 );
			throw 'resolution failed';
		},
	};

	const store = createReduxStore( 'test', {
		reducer,
		selectors,
		resolvers,
	} );

	const registry = createRegistry();
	registry.register( store );

	return { registry, store };
}

describe( 'useSuspenseSelect', () => {
	it( 'renders after suspending a few times', async () => {
		const { registry, store } = createRegistryWithStore();
		let attempts = 0;
		let renders = 0;

		const UI = () => {
			attempts++;
			const { result } = useSuspenseSelect( ( select ) => {
				const prefix = select( store ).getPrefix();
				const token = select( store ).getToken();
				const data = select( store ).getData( token );
				return { result: prefix + data };
			}, [] );
			renders++;
			return <div aria-label="loaded">{ result }</div>;
		};

		const App = () => (
			<RegistryProvider value={ registry }>
				<Suspense fallback="loading">
					<UI />
				</Suspense>
			</RegistryProvider>
		);

		render( <App /> );
		await screen.findByLabelText( 'loaded' );

		// Verify there were 3 attempts to render. Suspended twice because of
		// `getToken` and `getData` selectors not being resolved, and then finally
		// rendered after all data got loaded.
		expect( attempts ).toBe( 3 );
		expect( renders ).toBe( 1 );
	} );

	it( 'shows error when resolution fails', async () => {
		const { registry, store } = createRegistryWithStore();

		const UI = () => {
			const { token } = useSuspenseSelect( ( select ) => {
				// Call a selector whose resolution fails. The `useSuspenseSelect`
				// is then supposed to throw the resolution error.
				return { token: select( store ).getThatFails() };
			}, [] );
			return <div aria-label="loaded">{ token }</div>;
		};

		class Error extends Component {
			state = { error: null };

			static getDerivedStateFromError( error ) {
				return { error };
			}

			render() {
				const { children } = this.props;
				if ( this.state.error ) {
					return <div aria-label="error">{ this.state.error }</div>;
				}
				return children;
			}
		}

		const App = () => (
			<RegistryProvider value={ registry }>
				<Error>
					<Suspense fallback="loading">
						<UI />
					</Suspense>
				</Error>
			</RegistryProvider>
		);

		render( <App /> );
		const label = await screen.findByLabelText( 'error' );
		expect( label ).toHaveTextContent( 'resolution failed' );
		expect( console ).toHaveErrored();
	} );

	it( 'independent resolutions do not cause unrelated rerenders', async () => {
		const store = createReduxStore( 'test', {
			reducer: ( state = {}, action ) => {
				switch ( action.type ) {
					case 'RECEIVE':
						return { ...state, [ action.endpoint ]: action.data };
					default:
						return state;
				}
			},
			selectors: {
				getData: ( state, endpoint ) => state[ endpoint ],
			},
			resolvers: {
				getData:
					( endpoint ) =>
					async ( { dispatch } ) => {
						const delay = endpoint === 'slow' ? 30 : 10;
						await new Promise( ( r ) =>
							setTimeout( () => r(), delay )
						);
						dispatch( {
							type: 'RECEIVE',
							endpoint,
							data: endpoint,
						} );
					},
			},
		} );

		const registry = createRegistry();
		registry.register( store );

		const FastUI = jest.fn( () => {
			const data = useSuspenseSelect(
				( select ) => select( store ).getData( 'fast' ),
				[]
			);
			return <div aria-label="fast loaded">{ data }</div>;
		} );

		const SlowUI = jest.fn( () => {
			const data = useSuspenseSelect(
				( select ) => select( store ).getData( 'slow' ),
				[]
			);
			return <div aria-label="slow loaded">{ data }</div>;
		} );

		const App = () => (
			<RegistryProvider value={ registry }>
				<Suspense fallback="fast loading">
					<FastUI />
				</Suspense>
				<Suspense fallback="slow loading">
					<SlowUI />
				</Suspense>
			</RegistryProvider>
		);

		render( <App /> );

		const fastLabel = await screen.findByLabelText( 'fast loaded' );
		expect( fastLabel ).toHaveTextContent( 'fast' );

		const slowLabel = await screen.findByLabelText( 'slow loaded' );
		expect( slowLabel ).toHaveTextContent( 'slow' );

		expect( FastUI ).toHaveBeenCalledTimes( 2 );
		expect( SlowUI ).toHaveBeenCalledTimes( 2 );
	} );
} );
