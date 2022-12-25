/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { addFilter, removeAllFilters, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import withFilters from '..';

jest.useFakeTimers();

describe( 'withFilters', () => {
	const hookName = 'EnhancedComponent';
	const MyComponent = () => <div>My component</div>;

	afterEach( () => {
		removeAllFilters( hookName );
	} );

	it( 'should display original component when no filters applied', () => {
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		const { container } = render( <EnhancedComponent /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should display a component overridden by the filter', () => {
		const OverriddenComponent = () => <div>Overridden component</div>;
		addFilter(
			'EnhancedComponent',
			'test/enhanced-component-override',
			() => OverriddenComponent
		);
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		const { container } = render( <EnhancedComponent /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should display two components composed by the filter', () => {
		const ComposedComponent = () => <div>Composed component</div>;
		addFilter(
			hookName,
			'test/enhanced-component-compose',
			( FilteredComponent ) => () =>
				(
					<div>
						<FilteredComponent />
						<ComposedComponent />
					</div>
				)
		);
		const EnhancedComponent = withFilters( hookName )( MyComponent );

		const { container } = render( <EnhancedComponent /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should not re-render component when new filter added before component was mounted', () => {
		const SpiedComponent = jest.fn( () => <div>Spied component</div> );
		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () =>
				(
					<blockquote>
						<FilteredComponent />
					</blockquote>
				)
		);
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const { container } = render( <EnhancedComponent /> );

		act( () => jest.runAllTimers() );

		expect( SpiedComponent ).toHaveBeenCalledTimes( 1 );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render component once when new filter added after component was mounted', () => {
		const SpiedComponent = jest.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const { container } = render( <EnhancedComponent /> );

		SpiedComponent.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () =>
				(
					<blockquote>
						<FilteredComponent />
					</blockquote>
				)
		);

		act( () => jest.runAllTimers() );

		expect( SpiedComponent ).toHaveBeenCalledTimes( 1 );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render component once when two filters added in the same animation frame', () => {
		const SpiedComponent = jest.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const { container } = render( <EnhancedComponent /> );

		SpiedComponent.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () =>
				(
					<blockquote>
						<FilteredComponent />
					</blockquote>
				)
		);
		addFilter(
			hookName,
			'test/enhanced-component-spy-2',
			( FilteredComponent ) => () =>
				(
					<section>
						<FilteredComponent />
					</section>
				)
		);

		act( () => jest.runAllTimers() );

		expect( SpiedComponent ).toHaveBeenCalledTimes( 1 );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render component twice when new filter added and removed in two different animation frames', () => {
		const SpiedComponent = jest.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );
		const { container } = render( <EnhancedComponent /> );

		SpiedComponent.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy',
			( FilteredComponent ) => () =>
				(
					<div>
						<FilteredComponent />
					</div>
				)
		);

		act( () => jest.runAllTimers() );

		removeFilter( hookName, 'test/enhanced-component-spy' );

		act( () => jest.runAllTimers() );

		expect( SpiedComponent ).toHaveBeenCalledTimes( 2 );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render both components once each when one filter added', () => {
		const SpiedComponent = jest.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const CombinedComponents = () => (
			<section>
				<EnhancedComponent />
				<EnhancedComponent />
			</section>
		);
		const { container } = render( <CombinedComponents /> );

		SpiedComponent.mockClear();

		addFilter(
			hookName,
			'test/enhanced-component-spy-1',
			( FilteredComponent ) => () =>
				(
					<blockquote>
						<FilteredComponent />
					</blockquote>
				)
		);

		act( () => jest.runAllTimers() );

		expect( SpiedComponent ).toHaveBeenCalledTimes( 2 );
		expect( container ).toMatchSnapshot();
	} );
} );
