/**
 * External dependencies
 */
import { mount, shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { concatChildren } from '@wordpress/element';
import { addFilter, removeAllFilters } from '@wordpress/utils';

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
		addFilter(
			'EnhancedComponent',
			'test\enhanced-component-override',
			() => <div>Overridden component</div>
		);

		const wrapper = shallow( <EnhancedComponent /> );

		expect( wrapper.html() ).toBe( '<div>Overridden component</div>' );
	} );

	it( 'should display two components composed by the filter', () => {
		const ComposedComponent = () => <div>Composed component</div>;
		addFilter(
			hookName,
			'test\enhanced-component-compose',
			( element ) => concatChildren( element, <ComposedComponent /> )
		);

		const wrapper = mount( <EnhancedComponent /> );

		expect( wrapper.find( MyComponent ) ).toBePresent();
		expect( wrapper.find( ComposedComponent ) ).toBePresent();
	} );
} );
