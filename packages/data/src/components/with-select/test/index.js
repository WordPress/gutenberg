/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withSelect from '../';
import withDispatch from '../../with-dispatch';
import { createRegistry } from '../../../registry';
import { RegistryProvider } from '../../registry-provider';

/* eslint-disable @wordpress/wp-global-usage */
describe( 'withSelect', () => {
	const initialScriptDebug = globalThis.SCRIPT_DEBUG;

	beforeAll( () => {
		// Do not run HOC in development mode; it will call `mapSelect` an extra time.
		globalThis.SCRIPT_DEBUG = false;
	} );

	afterAll( () => {
		globalThis.SCRIPT_DEBUG = initialScriptDebug;
	} );

	it( 'passes the relevant data to the component', () => {
		const registry = createRegistry();
		registry.registerStore( 'reactReducer', {
			reducer: () => ( { reactKey: 'reactState' } ),
			selectors: {
				reactSelector: ( state, key ) => state[ key ],
			},
		} );

		// In normal circumstances, the fact that we have to add an arbitrary
		// prefix to the variable name would be concerning, and perhaps an
		// argument that we ought to expect developer to use select from the
		// `@wordpress/data` export. But in-fact, this serves as a good deterrent for
		// including both `withSelect` and `select` in the same scope, which
		// shouldn't occur for a typical component, and if it did might wrongly
		// encourage the developer to use `select` within the component itself.
		const mapSelectToProps = jest.fn( ( _select, ownProps ) => ( {
			data: _select( 'reactReducer' ).reactSelector( ownProps.keyName ),
		} ) );

		const OriginalComponent = jest.fn( ( props ) => (
			<div role="status">{ props.data }</div>
		) );

		const DataBoundComponent =
			withSelect( mapSelectToProps )( OriginalComponent );

		render(
			<RegistryProvider value={ registry }>
				<DataBoundComponent keyName="reactKey" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		// Wrapper is the enhanced component.
		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'reactState'
		);
	} );

	it( 'should rerun selection on state changes', async () => {
		const user = userEvent.setup();
		const registry = createRegistry();
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

		const mapSelectToProps = jest.fn( ( _select ) => ( {
			count: _select( 'counter' ).getCount(),
		} ) );

		const mapDispatchToProps = jest.fn( ( _dispatch ) => ( {
			increment: _dispatch( 'counter' ).increment,
		} ) );

		const OriginalComponent = jest.fn( ( props ) => (
			<button onClick={ props.increment }>{ props.count }</button>
		) );

		const DataBoundComponent = compose( [
			withSelect( mapSelectToProps ),
			withDispatch( mapDispatchToProps ),
		] )( OriginalComponent );

		render(
			<RegistryProvider value={ registry }>
				<DataBoundComponent />
			</RegistryProvider>
		);

		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( mapDispatchToProps ).toHaveBeenCalledTimes( 1 );

		// Simulate a click on the button.
		const button = screen.getByRole( 'button' );

		await user.click( button );

		expect( button ).toHaveTextContent( '1' );
		// 1. Initial mount
		// 2. When click handler is called.
		expect( mapDispatchToProps ).toHaveBeenCalledTimes( 2 );
		// 3 times
		// - 1 on initial render
		// - 1 on click triggering subscription firing.
		// - 1 on rerender.
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 3 );
		// Verifies component only renders twice.
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	describe( 'expected behaviour when dispatching actions during mount', () => {
		const testRegistry = createRegistry();
		testRegistry.registerStore( 'counter', {
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

		// @todo Should we allow this behaviour? Side-effects
		// on mount are discouraged in React (breaks Suspense and React Async Mode)
		// leaving in place for now under the assumption there's current usage
		// of withSelect in GB that expects support.
		class OriginalComponent extends Component {
			constructor( props ) {
				super( ...arguments );

				props.increment();
			}

			componentDidMount() {
				this.props.increment();
			}

			render() {
				return <div role="status">{ this.props.count }</div>;
			}
		}

		const renderSpy = jest.spyOn( OriginalComponent.prototype, 'render' );

		const mapSelectToProps = jest.fn( ( _select ) => ( {
			count: _select( 'counter' ).getCount(),
		} ) );

		const mapDispatchToProps = jest.fn( ( _dispatch ) => ( {
			increment: _dispatch( 'counter' ).increment,
		} ) );

		const DataBoundComponent = compose( [
			withSelect( mapSelectToProps ),
			withDispatch( mapDispatchToProps ),
		] )( OriginalComponent );

		it( 'should rerun if had dispatched action during mount', () => {
			const { unmount } = render(
				<RegistryProvider value={ testRegistry }>
					<DataBoundComponent />
				</RegistryProvider>
			);

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '2' );
			// Expected 3 times because:
			// - 1 on initial render
			// - 1 on effect before subscription set.
			// - 1 for the rerender because of the mapOutput change detected.
			expect( mapSelectToProps ).toHaveBeenCalledTimes( 3 );
			expect( renderSpy ).toHaveBeenCalledTimes( 2 );

			unmount();
		} );

		it( 'should rerun on unmount and mount', () => {
			render(
				<RegistryProvider value={ testRegistry }>
					<DataBoundComponent />
				</RegistryProvider>
			);

			expect( screen.getByRole( 'status' ) ).toHaveTextContent( '4' );
			// Expected an additional 3 times because of the unmount and remount:
			// - 1 on initial render
			// - 1 on effect before subscription set.
			// - once for the rerender because of the mapOutput change detected.
			expect( mapSelectToProps ).toHaveBeenCalledTimes( 6 );
			expect( renderSpy ).toHaveBeenCalledTimes( 4 );
		} );
	} );

	it( 'should rerun selection on props changes', () => {
		const registry = createRegistry();
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

		const mapSelectToProps = jest.fn( ( _select, ownProps ) => ( {
			count: _select( 'counter' ).getCount( ownProps.offset ),
		} ) );

		const OriginalComponent = jest.fn( ( props ) => (
			<div role="status">{ props.count }</div>
		) );

		const DataBoundComponent =
			withSelect( mapSelectToProps )( OriginalComponent );

		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<DataBoundComponent offset={ 0 } />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		rerender(
			<RegistryProvider value={ registry }>
				<DataBoundComponent offset={ 10 } />
			</RegistryProvider>
		);

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '10' );
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not run selection if props have not changed', () => {
		const registry = createRegistry();
		registry.registerStore( 'unchanging', {
			reducer: ( state = {} ) => state,
			selectors: {
				getState: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn();
		const OriginalComponent = jest.fn( () => <div /> );

		const DataBoundComponent = compose( [
			withSelect( mapSelectToProps ),
		] )( OriginalComponent );

		const Parent = ( props ) => (
			<DataBoundComponent propName={ props.propName } />
		);

		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<Parent propName="foo" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		rerender(
			<RegistryProvider value={ registry }>
				<Parent propName="foo" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not rerender if state has changed but merge props the same', async () => {
		const registry = createRegistry();
		registry.registerStore( 'demo', {
			reducer: () => ( {} ),
			selectors: {
				getUnchangingValue: () => 10,
			},
			actions: {
				update: () => ( { type: 'update' } ),
			},
		} );

		const mapSelectToProps = jest.fn( ( _select ) => ( {
			value: _select( 'demo' ).getUnchangingValue(),
		} ) );

		const OriginalComponent = jest.fn( () => <div /> );

		const DataBoundComponent =
			withSelect( mapSelectToProps )( OriginalComponent );

		render(
			<RegistryProvider value={ registry }>
				<DataBoundComponent />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		await act( async () => registry.dispatch( 'demo' ).update() );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render if props have changed but not state', () => {
		const registry = createRegistry();
		registry.registerStore( 'unchanging', {
			reducer: ( state = {} ) => state,
			selectors: {
				getState: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn();
		const OriginalComponent = jest.fn( () => <div /> );

		const DataBoundComponent = compose( [
			withSelect( mapSelectToProps ),
		] )( OriginalComponent );

		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<DataBoundComponent />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		rerender(
			<RegistryProvider value={ registry }>
				<DataBoundComponent propName="foo" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not rerun selection on unchanging state', async () => {
		const registry = createRegistry();
		const store = registry.registerStore( 'unchanging', {
			reducer: ( state = {} ) => state,
			selectors: {
				getState: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn();
		const OriginalComponent = jest.fn( () => <div /> );

		const DataBoundComponent = compose( [
			withSelect( mapSelectToProps ),
		] )( OriginalComponent );

		render(
			<RegistryProvider value={ registry }>
				<DataBoundComponent />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		await act( async () => store.dispatch( { type: 'dummy' } ) );

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'omits props which are not returned on subsequent mappings', () => {
		const registry = createRegistry();
		registry.registerStore( 'demo', {
			reducer: ( state = 'OK' ) => state,
			selectors: {
				getValue: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn( ( _select, ownProps ) => {
			return {
				[ ownProps.propName ]: _select( 'demo' ).getValue(),
			};
		} );

		const OriginalComponent = jest.fn( ( props ) => (
			<div role="status">{ JSON.stringify( props ) }</div>
		) );

		const DataBoundComponent =
			withSelect( mapSelectToProps )( OriginalComponent );

		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<DataBoundComponent propName="foo" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			JSON.stringify( {
				propName: 'foo',
				foo: 'OK',
			} )
		);

		rerender(
			<RegistryProvider value={ registry }>
				<DataBoundComponent propName="bar" />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			JSON.stringify( {
				propName: 'bar',
				bar: 'OK',
			} )
		);
	} );

	it( 'allows undefined return from mapSelectToProps', () => {
		const registry = createRegistry();
		registry.registerStore( 'demo', {
			reducer: ( state = 'OK' ) => state,
			selectors: {
				getValue: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn( ( _select, ownProps ) => {
			if ( ownProps.pass ) {
				return {
					count: _select( 'demo' ).getValue(),
				};
			}
		} );

		const OriginalComponent = jest.fn( ( props ) => (
			<div role="status">{ props.count || 'Unknown' }</div>
		) );

		const DataBoundComponent =
			withSelect( mapSelectToProps )( OriginalComponent );

		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<DataBoundComponent pass={ false } />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Unknown' );

		rerender(
			<RegistryProvider value={ registry }>
				<DataBoundComponent pass />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'OK' );

		rerender(
			<RegistryProvider value={ registry }>
				<DataBoundComponent pass={ false } />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 3 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 3 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Unknown' );
	} );

	it( 'should limit unnecessary selections run on children', async () => {
		const registry = createRegistry();
		registry.registerStore( 'childRender', {
			reducer: ( state = true, action ) =>
				action.type === 'TOGGLE_RENDER' ? ! state : state,
			selectors: {
				getValue: ( state ) => state,
			},
			actions: {
				toggleRender: () => ( { type: 'TOGGLE_RENDER' } ),
			},
		} );

		const childMapSelectToProps = jest.fn();
		const parentMapSelectToProps = jest.fn( ( _select ) => ( {
			isRenderingChild: _select( 'childRender' ).getValue(),
		} ) );

		const ChildOriginalComponent = jest.fn( () => <div /> );
		const ParentOriginalComponent = jest.fn( ( props ) => (
			<div>{ props.isRenderingChild ? <Child /> : null }</div>
		) );

		const Child = withSelect( childMapSelectToProps )(
			ChildOriginalComponent
		);
		const Parent = withSelect( parentMapSelectToProps )(
			ParentOriginalComponent
		);

		render(
			<RegistryProvider value={ registry }>
				<Parent />
			</RegistryProvider>
		);

		expect( childMapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( parentMapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( ChildOriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( ParentOriginalComponent ).toHaveBeenCalledTimes( 1 );

		// This is intentionally wrapped in an `act()` call.
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act( async () => {
			registry.dispatch( 'childRender' ).toggleRender();
		} );

		expect( childMapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( parentMapSelectToProps ).toHaveBeenCalledTimes( 3 );
		expect( ChildOriginalComponent ).toHaveBeenCalledTimes( 1 );
		expect( ParentOriginalComponent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should rerun selection on registry change', () => {
		const firstRegistry = createRegistry();
		firstRegistry.registerStore( 'demo', {
			reducer: ( state = 'first' ) => state,
			selectors: {
				getValue: ( state ) => state,
			},
		} );

		const mapSelectToProps = jest.fn( ( _select ) => ( {
			value: _select( 'demo' ).getValue(),
		} ) );

		const OriginalComponent = jest.fn( ( props ) => (
			<div role="status">{ props.value }</div>
		) );

		const DataBoundComponent =
			withSelect( mapSelectToProps )( OriginalComponent );

		const { rerender } = render(
			<RegistryProvider value={ firstRegistry }>
				<DataBoundComponent />
			</RegistryProvider>
		);

		expect( mapSelectToProps ).toHaveBeenCalledTimes( 1 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 1 );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'first' );

		const secondRegistry = createRegistry();
		secondRegistry.registerStore( 'demo', {
			reducer: ( state = 'second' ) => state,
			selectors: {
				getValue: ( state ) => state,
			},
		} );

		rerender(
			<RegistryProvider value={ secondRegistry }>
				<DataBoundComponent />
			</RegistryProvider>
		);

		// 2 times:
		// - 1 on initial render
		// - 1 on re-render
		expect( mapSelectToProps ).toHaveBeenCalledTimes( 2 );
		expect( OriginalComponent ).toHaveBeenCalledTimes( 2 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'second' );
	} );
} );
/* eslint-enable @wordpress/wp-global-usage */
