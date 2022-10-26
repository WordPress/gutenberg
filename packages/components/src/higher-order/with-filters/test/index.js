/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { addFilter, removeAllFilters, removeFilter } from '@wordpress/hooks';
import { act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import withFilters from '..';

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

		expect( container ).toMatchSnapshot();

		jest.runAllTimers();

		expect( SpiedComponent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should re-render component once when new filter added after component was mounted', async () => {
		const SpiedComponent = jest.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const { container } = render( <EnhancedComponent /> );

		SpiedComponent.mockClear();

		await act( () => {
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
			jest.runAllTimers();
		} );

		expect( SpiedComponent ).toHaveBeenCalledTimes( 1 );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render component once when two filters added in the same animation frame', async () => {
		const SpiedComponent = jest.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );

		const { container } = render( <EnhancedComponent /> );

		SpiedComponent.mockClear();

		await act( () => {
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
			jest.runAllTimers();
		} );

		expect( SpiedComponent ).toHaveBeenCalledTimes( 1 );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render component twice when new filter added and removed in two different animation frames', async () => {
		const SpiedComponent = jest.fn( () => <div>Spied component</div> );
		const EnhancedComponent = withFilters( hookName )( SpiedComponent );
		const { container } = render( <EnhancedComponent /> );

		SpiedComponent.mockClear();

		await act( () => {
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
			jest.runAllTimers();
		} );

		await act( () => {
			removeFilter( hookName, 'test/enhanced-component-spy' );
			jest.runAllTimers();
		} );

		expect( SpiedComponent ).toHaveBeenCalledTimes( 2 );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render both components once each when one filter added', async () => {
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

		await act( () => {
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
			jest.runAllTimers();
		} );

		expect( SpiedComponent ).toHaveBeenCalledTimes( 2 );
		expect( container ).toMatchSnapshot();
	} );
} );
