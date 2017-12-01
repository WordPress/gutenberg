/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { addFilter, removeAllFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import withFilters from '../';

describe( 'withFilters', () => {
	const hookName = 'EnhancedComponent';
	const MyComponent = () => <div>My component</div>;
	const EnhancedComponent = withFilters( hookName )( MyComponent );

	afterEach( () => {
		removeAllFilters( hookName );
	} );

	it( 'should display original component when no filters applied', () => {
		const wrapper = shallow( <EnhancedComponent /> );

		expect( wrapper.html() ).toBe( '<div>My component</div>' );
	} );

	it( 'should display a component overridden by the filter', () => {
		const OverriddenComponent = () => <div>Overridden component</div>;
		addFilter(
			'EnhancedComponent',
			'test/enhanced-component-override',
			() => OverriddenComponent
		);

		const wrapper = shallow( <EnhancedComponent /> );

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

		const wrapper = shallow( <EnhancedComponent /> );

		expect( wrapper.html() ).toBe( '<div><div>My component</div><div>Composed component</div></div>' );
	} );
} );
