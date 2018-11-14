/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';
import { omit } from 'lodash';

/**
 * Internal dependencies
 */
import withDispatch from '../';
import { createRegistry } from '../../../registry';
import RegistryProvider from '../../registry-provider';

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
					const actionReturnedFromDispatch = _dispatch( 'counter' ).increment( count );
					expect( actionReturnedFromDispatch ).toBe( undefined );
				},
			};
		} )( ( props ) => <button onClick={ props.increment } /> );

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component count={ 0 } />
			</RegistryProvider>
		);
		const testInstance = testRenderer.root;

		testRenderer.update(
			<RegistryProvider value={ registry }>
				<Component count={ 2 } />
			</RegistryProvider>
		);

		testInstance.findByType( 'button' ).props.onClick();

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

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ firstRegistry }>
				<Component />
			</RegistryProvider>
		);
		const testInstance = testRenderer.root;

		testInstance.findByType( 'button' ).props.onClick();
		expect( firstRegistryAction ).toHaveBeenCalledTimes( 2 );
		expect( secondRegistryAction ).toHaveBeenCalledTimes( 0 );

		const secondRegistry = createRegistry();
		secondRegistry.registerStore( 'demo', {
			reducer,
			actions: {
				noop: secondRegistryAction,
			},
		} );

		testRenderer.update(
			<RegistryProvider value={ secondRegistry }>
				<Component />
			</RegistryProvider>
		);

		testInstance.findByType( 'button' ).props.onClick();
		expect( firstRegistryAction ).toHaveBeenCalledTimes( 2 );
		expect( secondRegistryAction ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'passes new merge props if mapDispatchToProps varies on ownProps', () => {
		const Component = withDispatch( ( _dispatch, ownProps ) => {
			return { [ ownProps.propName ]() {} };
		} )( ( props ) => <button { ...omit( props, 'propName' ) } /> );

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component propName="onClick" />
			</RegistryProvider>
		);

		const instance = testRenderer.root;

		expect( Object.keys( instance.findByType( 'button' ).props ) ).toEqual( [ 'onClick' ] );

		testRenderer.update(
			<RegistryProvider value={ registry }>
				<Component propName="onKeyDown" />
			</RegistryProvider>
		);

		expect( Object.keys( instance.findByType( 'button' ).props ) ).toEqual( [ 'onKeyDown' ] );
	} );
} );
