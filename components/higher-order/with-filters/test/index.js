/**
 * External dependencies
 */
import { mount, shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { addFilter, removeAllFilters, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import withFilters from '..';

describe( 'withFilters', () => {
	let wrapper;

	const hookName = 'EnhancedComponent';
	const MyComponent = () => <div>My component</div>;

	afterEach( () => {
		wrapper.unmount();
		removeAllFilters( hookName );
	} );

	it( 'should display original component when no filters applied', () => {
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		wrapper = shallow( <EnhancedComponent /> );

		expect( wrapper.html() ).toBe( '<div>My component</div>' );
	} );

	it( 'should display a component overridden by the filter', () => {
		const OverriddenComponent = () => <div>Overridden component</div>;
		addFilter(
			'EnhancedComponent',
			'test/enhanced-component-override',
			() => OverriddenComponent
		);
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		wrapper = shallow( <EnhancedComponent /> );

		expect( wrapper.html() ).toBe( '<div>Overridden component</div>' );
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

		wrapper = shallow( <EnhancedComponent /> );

		expect( wrapper.html() ).toBe( '<div><div>My component</div><div>Composed component</div></div>' );
	} );

	it( 'should re-render component once when new filter added after component was mounted', () => {
		const spy = jest.fn();
		const SpiedComponent = () => {
			spy();
			return <div>Spied component</div>;
		};
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		wrapper = mount( <EnhancedComponent /> );

		spy.mockClear();
		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			FilteredComponent => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			),
		);
		jest.runAllTimers();

		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( wrapper.html() ).toBe( '<blockquote><div>Spied component</div></blockquote>' );
	} );

	it( 'should re-render component once when two filters added in the same animation frame', () => {
		const spy = jest.fn();
		const SpiedComponent = () => {
			spy();
			return <div>Spied component</div>;
		};
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );
		wrapper = mount( <EnhancedComponent /> );

		spy.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			FilteredComponent => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			),
		);
		addFilter(
			hookName,
			'test/enhanced-component-spy-2',
			FilteredComponent => () => (
				<section>
					<FilteredComponent />
				</section>
			),
		);
		jest.runAllTimers();

		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( wrapper.html() ).toBe( '<section><blockquote><div>Spied component</div></blockquote></section>' );
	} );

	it( 'should re-render component twice when new filter added and removed in two different animation frames', () => {
		const spy = jest.fn();
		const SpiedComponent = () => {
			spy();
			return <div>Spied component</div>;
		};
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );
		wrapper = mount( <EnhancedComponent /> );

		spy.mockClear();
		addFilter(
			hookName,
			'test/enhanced-component-spy',
			FilteredComponent => () => (
				<div>
					<FilteredComponent />
				</div>
			),
		);
		jest.runAllTimers();

		removeFilter(
			hookName,
			'test/enhanced-component-spy',
		);
		jest.runAllTimers();

		expect( spy ).toHaveBeenCalledTimes( 2 );
		expect( wrapper.html() ).toBe( '<div>Spied component</div>' );
	} );

	it( 'should re-render both components once each when one filter added', () => {
		const spy = jest.fn();
		const SpiedComponent = () => {
			spy();
			return <div>Spied component</div>;
		};
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );
		const CombinedComponents = () => (
			<div>
				<EnhancedComponent />
				<EnhancedComponent />
			</div>
		);
		wrapper = mount( <CombinedComponents /> );

		spy.mockClear();
		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			FilteredComponent => () => (
				<blockquote>
					<FilteredComponent />
				</blockquote>
			),
		);
		jest.runAllTimers();

		expect( spy ).toHaveBeenCalledTimes( 2 );
		expect( wrapper.html() ).toBe( '<div><blockquote><div>Spied component</div></blockquote><blockquote><div>Spied component</div></blockquote></div>' );
	} );
} );
