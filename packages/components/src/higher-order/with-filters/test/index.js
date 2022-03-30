/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { addFilter, removeAllFilters, removeFilter } from '@wordpress/hooks';
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withFilters from '..';

describe( 'withFilters', () => {
	let shallowWrapper;
	const hookName = 'EnhancedComponent';
	const MyComponent = () => <div>My component</div>;

	afterEach( () => {
		if ( shallowWrapper ) {
			shallowWrapper.unmount();
		}
		removeAllFilters( hookName );
	} );

	it( 'should display original component when no filters applied', () => {
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		shallowWrapper = shallow( <EnhancedComponent /> );

		expect( shallowWrapper.html() ).toBe( '<div>My component</div>' );
	} );

	it( 'should display a component overridden by the filter', () => {
		const OverriddenComponent = () => <div>Overridden component</div>;
		addFilter(
			'EnhancedComponent',
			'test/enhanced-component-override',
			() => OverriddenComponent
		);
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		shallowWrapper = shallow( <EnhancedComponent /> );

		expect( shallowWrapper.html() ).toBe(
			'<div>Overridden component</div>'
		);
	} );

	it( 'should display two components composed by the filter', () => {
		const ComposedComponent = () => <div>Composed component</div>;
		addFilter(
			hookName,
			'test/enhanced-component-compose',
			( FilteredComponent ) => () => (
				<div>
					<FilteredComponent />
					<ComposedComponent />
				</div>
			)
		);
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		shallowWrapper = shallow( <EnhancedComponent /> );

		expect( shallowWrapper.html() ).toBe(
			'<div><div>My component</div><div>Composed component</div></div>'
		);
	} );

	it( 'should not re-render component when new filter added before component was mounted', () => {
		const spy = jest.fn();
		const SpiedComponent = () => {
			spy();
			return <div>Spied component</div>;
		};
		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			)
		);
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const container = document.createElement( 'div' );
		const root = createRoot( container );
		root.render( <EnhancedComponent /> );

		jest.runAllTimers();

		expect( spy ).toHaveBeenCalledTimes( 1 );

		expect( container.innerHTML ).toBe(
			'<blockquote><div>Spied component</div></blockquote>'
		);
	} );

	it( 'should re-render component once when new filter added after component was mounted', () => {
		const spy = jest.fn();
		const SpiedComponent = () => {
			spy();
			return <div>Spied component</div>;
		};
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const container = document.createElement( 'div' );
		const root = createRoot( container );
		root.render( <EnhancedComponent /> );

		spy.mockClear();
		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			)
		);
		jest.runAllTimers();

		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( container.innerHTML ).toBe(
			'<blockquote><div>Spied component</div></blockquote>'
		);
	} );

	it( 'should re-render component once when two filters added in the same animation frame', () => {
		const spy = jest.fn();
		const SpiedComponent = () => {
			spy();
			return <div>Spied component</div>;
		};
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );
		const container = document.createElement( 'div' );
		const root = createRoot( container );
		root.render( <EnhancedComponent /> );

		spy.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			)
		);
		addFilter(
			hookName,
			'test/enhanced-component-spy-2',
			( FilteredComponent ) => () => (
				<section>
					<FilteredComponent />
				</section>
			)
		);
		jest.runAllTimers();

		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( container.innerHTML ).toBe(
			'<section><blockquote><div>Spied component</div></blockquote></section>'
		);
	} );

	it( 'should re-render component twice when new filter added and removed in two different animation frames', () => {
		const spy = jest.fn();
		const SpiedComponent = () => {
			spy();
			return <div>Spied component</div>;
		};
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );
		const container = document.createElement( 'div' );
		const root = createRoot( container );
		root.render( <EnhancedComponent /> );

		spy.mockClear();
		addFilter(
			hookName,
			'test/enhanced-component-spy',
			( FilteredComponent ) => () => (
				<div>
					<FilteredComponent />
				</div>
			)
		);
		jest.runAllTimers();

		removeFilter( hookName, 'test/enhanced-component-spy' );
		jest.runAllTimers();

		expect( spy ).toHaveBeenCalledTimes( 2 );
		expect( container.innerHTML ).toBe( '<div>Spied component</div>' );
	} );

	it( 'should re-render both components once each when one filter added', () => {
		const spy = jest.fn();
		const SpiedComponent = () => {
			spy();
			return <div>Spied component</div>;
		};
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );
		const CombinedComponents = () => (
			<section>
				<EnhancedComponent />
				<EnhancedComponent />
			</section>
		);
		const container = document.createElement( 'div' );
		const root = createRoot( container );
		root.render( <CombinedComponents /> );

		spy.mockClear();
		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			)
		);
		jest.runAllTimers();

		expect( spy ).toHaveBeenCalledTimes( 2 );
		expect( container.innerHTML ).toBe(
			'<section><blockquote><div>Spied component</div></blockquote><blockquote><div>Spied component</div></blockquote></section>'
		);
	} );
} );
