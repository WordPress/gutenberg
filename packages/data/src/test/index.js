/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * WordPress dependencies
 */
import { compose, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	registerReducer,
	registerSelectors,
	registerActions,
	dispatch,
	withSelect,
	withDispatch,
} from '../';

describe( 'withSelect', () => {
	let wrapper, store;

	afterEach( () => {
		if ( wrapper ) {
			wrapper.unmount();
			wrapper = null;
		}
	} );

	it( 'passes the relevant data to the component', () => {
		registerReducer( 'reactReducer', () => ( { reactKey: 'reactState' } ) );
		registerSelectors( 'reactReducer', {
			reactSelector: ( state, key ) => state[ key ],
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

		wrapper = mount( <Component keyName="reactKey" /> );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		// Wrapper is the enhanced component. Find props on the rendered child.
		const child = wrapper.childAt( 0 );
		expect( child.props() ).toEqual( {
			keyName: 'reactKey',
			data: 'reactState',
		} );
		expect( wrapper.text() ).toBe( 'reactState' );
	} );

	it( 'should rerun selection on state changes', () => {
		registerReducer( 'counter', ( state = 0, action ) => {
			if ( action.type === 'increment' ) {
				return state + 1;
			}

			return state;
		} );

		registerSelectors( 'counter', {
			getCount: ( state ) => state,
		} );

		registerActions( 'counter', {
			increment: () => ( { type: 'increment' } ),
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

		wrapper = mount( <Component /> );

		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( mapDispatchToProps ).toHaveBeenCalledTimes( 1 );

		const button = wrapper.find( 'button' );

		button.simulate( 'click' );

		expect( button.text() ).toBe( '1' );
		// 3 times =
		//  1. Initial mount
		//  2. When click handler is called
		//  3. After select updates its merge props
		expect( mapDispatchToProps ).toHaveBeenCalledTimes( 3 );
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should rerun selection on props changes', () => {
		registerReducer( 'counter', ( state = 0, action ) => {
			if ( action.type === 'increment' ) {
				return state + 1;
			}

			return state;
		} );

		registerSelectors( 'counter', {
			getCount: ( state, offset ) => state + offset,
		} );

		const mapSelectToProps = jest.fn().mockImplementation( ( _select, ownProps ) => ( {
			count: _select( 'counter' ).getCount( ownProps.offset ),
		} ) );

		const OriginalComponent = jest.fn().mockImplementation( ( props ) => (
			<div>{ props.count }</div>
		) );

		const Component = withSelect( mapSelectToProps )( OriginalComponent );

		wrapper = mount( <Component offset={ 0 } /> );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		wrapper.setProps( { offset: 10 } );

		expect( wrapper.childAt( 0 ).text() ).toBe( '10' );
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should render if props have changed but not state', () => {
		store = registerReducer( 'unchanging', ( state = {} ) => state );

		registerSelectors( 'unchanging', {
			getState: ( state ) => state,
		} );

		const mapSelectToProps = jest.fn();

		const OriginalComponent = jest.fn().mockImplementation( () => <div /> );

		const Component = compose( [
			withSelect( mapSelectToProps ),
		] )( OriginalComponent );

		wrapper = mount( <Component /> );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		wrapper.setProps( { propName: 'foo' } );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not rerun selection on unchanging state', () => {
		store = registerReducer( 'unchanging', ( state = {} ) => state );

		registerSelectors( 'unchanging', {
			getState: ( state ) => state,
		} );

		const mapSelectToProps = jest.fn();

		const OriginalComponent = jest.fn().mockImplementation( () => <div /> );

		const Component = compose( [
			withSelect( mapSelectToProps ),
		] )( OriginalComponent );

		wrapper = mount( <Component /> );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		store.dispatch( { type: 'dummy' } );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'omits props which are not returned on subsequent mappings', () => {
		registerReducer( 'demo', ( state = 'OK' ) => state );
		registerSelectors( 'demo', {
			getValue: ( state ) => state,
		} );

		const mapSelectToProps = jest.fn().mockImplementation( ( _select, ownProps ) => {
			return {
				[ ownProps.propName ]: _select( 'demo' ).getValue(),
			};
		} );

		const OriginalComponent = jest.fn().mockImplementation( () => <div /> );

		const Component = withSelect( mapSelectToProps )( OriginalComponent );

		wrapper = mount( <Component propName="foo" /> );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( wrapper.childAt( 0 ).props() ).toEqual( { foo: 'OK', propName: 'foo' } );

		wrapper.setProps( { propName: 'bar' } );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
		expect( wrapper.childAt( 0 ).props() ).toEqual( { bar: 'OK', propName: 'bar' } );
	} );

	it( 'allows undefined return from mapSelectToProps', () => {
		registerReducer( 'demo', ( state = 'OK' ) => state );
		registerSelectors( 'demo', {
			getValue: ( state ) => state,
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

		wrapper = mount( <Component pass={ false } /> );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( wrapper.childAt( 0 ).text() ).toBe( 'Unknown' );

		wrapper.setProps( { pass: true } );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
		expect( wrapper.childAt( 0 ).text() ).toBe( 'OK' );

		wrapper.setProps( { pass: false } );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 3 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 3 );
		expect( wrapper.childAt( 0 ).text() ).toBe( 'Unknown' );
	} );

	it( 'should run selections on parents before its children', () => {
		registerReducer( 'childRender', ( state = true, action ) => (
			action.type === 'TOGGLE_RENDER' ? ! state : state
		) );
		registerSelectors( 'childRender', {
			getValue: ( state ) => state,
		} );
		registerActions( 'childRender', {
			toggleRender: () => ( { type: 'TOGGLE_RENDER' } ),
		} );

		const childMapStateToProps = jest.fn();
		const parentMapStateToProps = jest.fn().mockImplementation( ( _select ) => ( {
			isRenderingChild: _select( 'childRender' ).getValue(),
		} ) );

		const ChildOriginalComponent = jest.fn().mockImplementation( () => <div /> );
		const ParentOriginalComponent = jest.fn().mockImplementation( ( props ) => (
			<div>{ props.isRenderingChild ? <Child /> : null }</div>
		) );

		const Child = withSelect( childMapStateToProps )( ChildOriginalComponent );
		const Parent = withSelect( parentMapStateToProps )( ParentOriginalComponent );

		wrapper = mount( <Parent /> );

		expect( childMapStateToProps ).toHaveBeenCalledTimes( 1 );
		expect( parentMapStateToProps ).toHaveBeenCalledTimes( 1 );
		expect( ChildOriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( ParentOriginalComponent ).toHaveBeenCalledTimes( 1 );

		dispatch( 'childRender' ).toggleRender();

		expect( childMapStateToProps ).toHaveBeenCalledTimes( 1 );
		expect( parentMapStateToProps ).toHaveBeenCalledTimes( 2 );
		expect( ChildOriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( ParentOriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );
} );

describe( 'withDispatch', () => {
	let wrapper;
	afterEach( () => {
		if ( wrapper ) {
			wrapper.unmount();
			wrapper = null;
		}
	} );

	it( 'passes the relevant data to the component', () => {
		const store = registerReducer( 'counter', ( state = 0, action ) => {
			if ( action.type === 'increment' ) {
				return state + action.count;
			}
			return state;
		} );

		const increment = ( count = 1 ) => ( { type: 'increment', count } );
		registerActions( 'counter', {
			increment,
		} );

		const Component = withDispatch( ( _dispatch, ownProps ) => {
			const { count } = ownProps;

			return {
				increment: () => _dispatch( 'counter' ).increment( count ),
			};
		} )( ( props ) => <button onClick={ props.increment } /> );

		wrapper = mount( <Component count={ 0 } /> );

		// Wrapper is the enhanced component. Find props on the rendered child.
		const child = wrapper.childAt( 0 );

		const incrementBeforeSetProps = child.prop( 'increment' );

		// Verify that dispatch respects props at the time of being invoked by
		// changing props after the initial mount.
		wrapper.setProps( { count: 2 } );

		// Function value reference should not have changed in props update.
		expect( child.prop( 'increment' ) ).toBe( incrementBeforeSetProps );

		wrapper.find( 'button' ).simulate( 'click' );

		expect( store.getState() ).toBe( 2 );
	} );
} );
