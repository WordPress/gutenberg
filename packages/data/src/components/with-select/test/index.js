/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import withSelect from '../';
import withDispatch from '../../with-dispatch';
import { createRegistry } from '../../../registry';
import RegistryProvider from '../../registry-provider';

describe( 'withSelect', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'passes the relevant data to the component', () => {
		registry.registerStore( 'reactReducer', {
			reducer: () => ( { reactKey: 'reactState' } ),
			selectors: {
				reactSelector: ( state, key ) => state[ key ],
			},
		} );

		// In normal circumstances, the fact that we have to add an arbitrary
		// prefix to the variable name would be concerning, and perhaps an
		// argument that we ought to expect developer to use select from the
		// wp.data export. But in-fact, this serves as a good deterrent for
		// including both `withSelect` and `select` in the same scope, which
		// shouldn't occur for a typical component, and if it did might wrongly
		// encourage the developer to use `select` within the component itself.
		const mapSelectToProps = jest.fn().mockImplementation( ( _select, ownProps ) => ( {
			data: _select( 'reactReducer' ).reactSelector( ownProps.keyName ),
		} ) );

		const OriginalComponent = jest.fn().mockImplementation( ( props ) => (
			<div>{ props.data }</div>
		) );

		const Component = withSelect( mapSelectToProps )( OriginalComponent );

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component keyName="reactKey" />
			</RegistryProvider>
		);
		const testInstance = testRenderer.root;

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		// Wrapper is the enhanced component. Find props on the rendered child.
		expect( testInstance.findByType( 'div' ).props ).toEqual( {
			children: 'reactState',
		} );
	} );

	it( 'should rerun selection on state changes', () => {
		registry.registerStore( 'counter', {
			reducer: ( state = 0, action ) => {
				if ( action.type === 'increment' ) {
					return state + 1;
				}

				return state;
			},
			selectors: {
				getCount: ( state ) => state,
			},
			actions: {
				increment: () => ( { type: 'increment' } ),
			},
		} );

		const mapSelectToProps = jest.fn().mockImplementation( ( _select ) => ( {
			count: _select( 'counter' ).getCount(),
		} ) );

		const mapDispatchToProps = jest.fn().mockImplementation( ( _dispatch ) => ( {
			increment: _dispatch( 'counter' ).increment,
		} ) );

		const OriginalComponent = jest.fn().mockImplementation( ( props ) => (
			<button onClick={ props.increment }>
				{ props.count }
			</button>
		) );

		const Component = compose( [
			withSelect( mapSelectToProps ),
			withDispatch( mapDispatchToProps ),
		] )( OriginalComponent );

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component />
			</RegistryProvider>
		);
		const testInstance = testRenderer.root;

		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( mapDispatchToProps ).toHaveBeenCalledTimes( 1 );

		// Simulate a click on the button
		testInstance.findByType( 'button' ).props.onClick();

		expect( testInstance.findByType( 'button' ).props.children ).toBe( 1 );
		// 3 times =
		//  1. Initial mount
		//  2. When click handler is called
		//  3. After select updates its merge props
		expect( mapDispatchToProps ).toHaveBeenCalledTimes( 3 );
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should rerun selection on props changes', () => {
		registry.registerStore( 'counter', {
			reducer: ( state = 0, action ) => {
				if ( action.type === 'increment' ) {
					return state + 1;
				}

				return state;
			},
			selectors: {
				getCount: ( state, offset ) => state + offset,
			},
		} );

		const mapSelectToProps = jest.fn().mockImplementation( ( _select, ownProps ) => ( {
			count: _select( 'counter' ).getCount( ownProps.offset ),
		} ) );

		const OriginalComponent = jest.fn().mockImplementation( ( props ) => (
			<div>{ props.count }</div>
		) );

		const Component = withSelect( mapSelectToProps )( OriginalComponent );

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component offset={ 0 } />
			</RegistryProvider>
		);
		const testInstance = testRenderer.root;

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		testRenderer.update(
			<RegistryProvider value={ registry }>
				<Component offset={ 10 } />
			</RegistryProvider>
		);

		expect( testInstance.findByType( 'div' ).props.children ).toBe( 10 );
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not run selection if props have not changed', () => {
		registry.registerStore( 'unchanging', {
			reducer: ( state = {} ) => state,
			selectors: {
				getState: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn();

		const OriginalComponent = jest.fn().mockImplementation( () => <div /> );

		const Component = compose( [
			withSelect( mapSelectToProps ),
		] )( OriginalComponent );

		const Parent = ( props ) => <Component propName={ props.propName } />;

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Parent propName="foo" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		testRenderer.update(
			<RegistryProvider value={ registry }>
				<Parent propName="foo" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not run selection if state has changed but merge props the same', () => {
		registry.registerStore( 'demo', {
			reducer: () => ( {} ),
			selectors: {
				getUnchangingValue: () => 10,
			},
			actions: {
				update: () => ( { type: 'update' } ),
			},
		} );

		const mapSelectToProps = jest.fn().mockImplementation( ( _select ) => ( {
			value: _select( 'demo' ).getUnchangingValue(),
		} ) );

		const OriginalComponent = jest.fn().mockImplementation( () => <div /> );

		const Component = withSelect( mapSelectToProps )( OriginalComponent );

		TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		registry.dispatch( 'demo' ).update();

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render if props have changed but not state', () => {
		registry.registerStore( 'unchanging', {
			reducer: ( state = {} ) => state,
			selectors: {
				getState: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn();

		const OriginalComponent = jest.fn().mockImplementation( () => <div /> );

		const Component = compose( [
			withSelect( mapSelectToProps ),
		] )( OriginalComponent );

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		testRenderer.update(
			<RegistryProvider value={ registry }>
				<Component propName="foo" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not rerun selection on unchanging state', () => {
		const store = registry.registerStore( 'unchanging', {
			reducer: ( state = {} ) => state,
			selectors: {
				getState: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn();

		const OriginalComponent = jest.fn().mockImplementation( () => <div /> );

		const Component = compose( [
			withSelect( mapSelectToProps ),
		] )( OriginalComponent );

		TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		store.dispatch( { type: 'dummy' } );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'omits props which are not returned on subsequent mappings', () => {
		registry.registerStore( 'demo', {
			reducer: ( state = 'OK' ) => state,
			selectors: {
				getValue: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn().mockImplementation( ( _select, ownProps ) => {
			return {
				[ ownProps.propName ]: _select( 'demo' ).getValue(),
			};
		} );

		const OriginalComponent = jest.fn()
			.mockImplementation( ( props ) => <div>{ JSON.stringify( props ) }</div> );

		const Component = withSelect( mapSelectToProps )( OriginalComponent );

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component propName="foo" />
			</RegistryProvider>
		);
		const testInstance = testRenderer.root;

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		expect( JSON.parse( testInstance.findByType( 'div' ).props.children ) )
			.toEqual( { foo: 'OK', propName: 'foo' } );

		testRenderer.update(
			<RegistryProvider value={ registry }>
				<Component propName="bar" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
		expect( JSON.parse( testInstance.findByType( 'div' ).props.children ) )
			.toEqual( { bar: 'OK', propName: 'bar' } );
	} );

	it( 'allows undefined return from mapSelectToProps', () => {
		registry.registerStore( 'demo', {
			reducer: ( state = 'OK' ) => state,
			selectors: {
				getValue: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn().mockImplementation( ( _select, ownProps ) => {
			if ( ownProps.pass ) {
				return {
					count: _select( 'demo' ).getValue(),
				};
			}
		} );

		const OriginalComponent = jest.fn().mockImplementation( (
			( props ) => <div>{ props.count || 'Unknown' }</div>
		) );

		const Component = withSelect( mapSelectToProps )( OriginalComponent );

		const testRenderer = TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Component pass={ false } />
			</RegistryProvider>
		);
		const testInstance = testRenderer.root;

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( testInstance.findByType( 'div' ).props.children ).toBe( 'Unknown' );

		testRenderer.update(
			<RegistryProvider value={ registry }>
				<Component pass />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
		expect( testInstance.findByType( 'div' ).props.children ).toBe( 'OK' );

		testRenderer.update(
			<RegistryProvider value={ registry }>
				<Component pass={ false } />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 3 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 3 );
		expect( testInstance.findByType( 'div' ).props.children ).toBe( 'Unknown' );
	} );

	it( 'should run selections on parents before its children', () => {
		registry.registerStore( 'childRender', {
			reducer: ( state = true, action ) => (
				action.type === 'TOGGLE_RENDER' ? ! state : state
			),
			selectors: {
				getValue: ( state ) => state,
			},
			actions: {
				toggleRender: () => ( { type: 'TOGGLE_RENDER' } ),
			},
		} );

		const childMapSelectToProps = jest.fn();
		const parentMapSelectToProps = jest.fn().mockImplementation( ( _select ) => ( {
			isRenderingChild: _select( 'childRender' ).getValue(),
		} ) );

		const ChildOriginalComponent = jest.fn().mockImplementation( () => <div /> );
		const ParentOriginalComponent = jest.fn().mockImplementation( ( props ) => (
			<div>{ props.isRenderingChild ? <Child /> : null }</div>
		) );

		const Child = withSelect( childMapSelectToProps )( ChildOriginalComponent );
		const Parent = withSelect( parentMapSelectToProps )( ParentOriginalComponent );

		TestRenderer.create(
			<RegistryProvider value={ registry }>
				<Parent />
			</RegistryProvider>
		);

		expect( childMapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( parentMapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( ChildOriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( ParentOriginalComponent ).toHaveBeenCalledTimes( 1 );

		registry.dispatch( 'childRender' ).toggleRender();

		expect( childMapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( parentMapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( ChildOriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( ParentOriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );
} );
