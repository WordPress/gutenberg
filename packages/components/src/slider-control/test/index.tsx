/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { SliderControl } from '../index';

const renderSliderControl = ( props = {} ) => {
	// Disabled because of our rule restricting literal IDs, preferring
	// `withInstanceId`. In this case, it's fine to use literal IDs.
	// eslint-disable-next-line no-restricted-syntax
	return render( <SliderControl id="slider" { ...props } /> );
};

describe( 'SliderControl', () => {
	test( 'should render correctly', () => {
		const { container } = renderSliderControl();
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render min', () => {
		const { container } = renderSliderControl( { min: 5 } );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render max', () => {
		const { container } = renderSliderControl( { max: 50 } );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render size', () => {
		const { container } = renderSliderControl( {
			size: '__unstable-large',
		} );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render value', () => {
		const { container } = renderSliderControl( { value: 40 } );
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
