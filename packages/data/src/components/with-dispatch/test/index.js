/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import withDispatch from '../';
import { createRegistry } from '../../../registry';
import { RegistryProvider } from '../../registry-provider';

describe( 'withDispatch', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'passes the relevant data to the component', () => {
		const store = registry.registerStore( 'counter', {
			reducer: ( state = 0, action ) => {
				if ( action.type === 'increment' ) {
					return state + action.count;
				}
				return state;
			},
			actions: {
				increment: ( count = 1 ) => ( { type: 'increment', count } ),
			},
		} );

		const Component = withDispatch( ( _dispatch, ownProps ) => {
			const { count } = ownProps;

			return {
				increment: () => {
					const actionReturnedFromDispatch = Promise.resolve( _dispatch( 'counter' ).increment( count ) );
					expect( actionReturnedFromDispatch ).resolves.toEqual(
						{
							type: 'increment',
							count,
						}
					);
				},
			};
		} )( ( props ) => <button onClick={ props.increment } /> );

		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					<Component count={ 0 } />
				</RegistryProvider>
			);
		} );
		const testInstance = testRenderer.root;

		const incrementBeforeSetProps = testInstance.findByType( 'button' ).props.onClick;

		// Verify that dispatch respects props at the time of being invoked by
		// changing props after the initial mount.
		act( () => {
			testRenderer.update(
				<RegistryProvider value={ registry }>
					<Component count={ 2 } />
				</RegistryProvider>
			);
		} );

		// Function value reference should not have changed in props update.
		expect( testInstance.findByType( 'button' ).props.onClick ).toBe( incrementBeforeSetProps );

		act( () => {
			incrementBeforeSetProps();
		} );

		expect( store.getState() ).toBe( 2 );
	} );

	it( 'calls dispatch on the correct registry if updated', () => {
		const reducer = ( state = null ) => state;
		const noop = () => ( { type: '__INERT__' } );
		const firstRegistryAction = jest.fn().mockImplementation( noop );
		const secondRegistryAction = jest.fn().mockImplementation( noop );

		const firstRegistry = registry;
		firstRegistry.registerStore( 'demo', {
			reducer,
			actions: {
				noop: firstRegistryAction,
			},
		} );

		const Component = withDispatch( ( _dispatch ) => {
			const noopByReference = _dispatch( 'demo' ).noop;

			return {
				noop() {
					_dispatch( 'demo' ).noop();
					noopByReference();
				},
			};
		} )( ( props ) => <button onClick={ props.noop } /> );

		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create(
				<RegistryProvider value={ firstRegistry }>
					<Component />
				</RegistryProvider>
			);
		} );
		const testInstance = testRenderer.root;

		act( () => {
			testInstance.findByType( 'button' ).props.onClick();
		} );
		expect( firstRegistryAction ).toHaveBeenCalledTimes( 2 );
		expect( secondRegistryAction ).toHaveBeenCalledTimes( 0 );

		const secondRegistry = createRegistry();
		secondRegistry.registerStore( 'demo', {
			reducer,
			actions: {
				noop: secondRegistryAction,
			},
		} );

		act( () => {
			testRenderer.update(
				<RegistryProvider value={ secondRegistry }>
					<Component />
				</RegistryProvider>
			);
		} );
		act( () => {
			testInstance.findByType( 'button' ).props.onClick();
		} );
		expect( firstRegistryAction ).toHaveBeenCalledTimes( 2 );
		expect( secondRegistryAction ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'always calls select with the latest state in the handler passed to ' +
		'the component', () => {
		const store = registry.registerStore( 'counter', {
			reducer: ( state = 0, action ) => {
				if ( action.type === 'update' ) {
					return action.count;
				}
				return state;
			},
			actions: {
				update: ( count ) => ( { type: 'update', count } ),
			},
			selectors: {
				getCount: ( state ) => state,
			},
		} );

		const Component = withDispatch( ( _dispatch, ownProps, { select: _select } ) => {
			const outerCount = _select( 'counter' ).getCount();
			return {
				update: () => {
					const innerCount = _select( 'counter' ).getCount();
					expect( innerCount ).toBe( outerCount );
					const actionReturnedFromDispatch = Promise.resolve(
						_dispatch( 'counter' ).update( innerCount + 1 )
					);
					expect( actionReturnedFromDispatch ).resolves.toEqual( {
						type: 'update',
						count: innerCount + 1,
					} );
				},
			};
		} )( ( props ) => <button onClick={ props.update } /> );

		let testRenderer;
		act( () => {
			testRenderer = TestRenderer.create(
				<RegistryProvider value={ registry }>
					<Component />
				</RegistryProvider>
			);
		} );

		const counterUpdateHandler = testRenderer.root.findByType( 'button' ).props.onClick;

		act( () => {
			counterUpdateHandler();
		} );
		expect( store.getState() ).toBe( 1 );

		act( () => {
			counterUpdateHandler();
		} );
		expect( store.getState() ).toBe( 2 );

		act( () => {
			counterUpdateHandler();
		} );
		expect( store.getState() ).toBe( 3 );
	} );

	it( 'warns when mapDispatchToProps returns non-function property', () => {
		const Component = withDispatch( () => {
			return {
				count: 3,
			};
		} )( () => null );

		act( () => {
			TestRenderer.create(
				<RegistryProvider value={ registry }>
					<Component />
				</RegistryProvider>
			);
		} );
		expect( console ).toHaveWarnedWith(
			'Property count returned from dispatchMap in useDispatchWithMap must be a function.'
		);
	} );
} );
