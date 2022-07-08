/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import React from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Slider } from '../index';

const renderSlider = ( props = {} ) => {
	// Disabled because of our rule restricting literal IDs, preferring
	// `withInstanceId`. In this case, it's fine to use literal IDs.
	// eslint-disable-next-line no-restricted-syntax
	return render( <Slider id="slider" { ...props } /> );
};

const rerenderSlider = ( props = {}, rerender ) => {
	// Disabled because of our rule restricting literal IDs, preferring
	// `withInstanceId`. In this case, it's fine to use literal IDs.
	// eslint-disable-next-line no-restricted-syntax
	return rerender( <Slider id="slider" { ...props } /> );
};

const getSliderInput = (): HTMLInputElement => {
	return screen.getByRole( 'slider' );
};

describe( 'Slider', () => {
	test( 'should render correctly', () => {
		const { container } = renderSlider();
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render min', () => {
		const { container } = renderSlider( { min: 5 } );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render max', () => {
		const { container } = renderSlider( { max: 50 } );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render size', () => {
		const { container } = renderSlider( { size: 'small' } );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render value', () => {
		const { container } = renderSlider( { value: 40 } );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render unit value', () => {
		const { container } = renderSlider( { value: '40px' } );
		const input = getSliderInput();

		expect( container.firstChild ).toMatchSnapshot();
		expect( input.value ).toEqual( '40' );
	} );

	test( 'should include unit in onChange callback (if value contains unit)', () => {
		let value = '40px';
		const setValue = ( next ) => ( value = next );

		renderSlider( { onChange: setValue, value } );
		const input = getSliderInput();
		fireEvent.change( input, { target: { value: 13 } } );

		// onChange callback value
		expect( value ).toBe( '13px' );
	} );

	test( 'should change unit in onChange callback, if incoming value unit changes', () => {
		let value = '40px';
		const setValue = ( next ) => ( value = next );

		const { rerender } = renderSlider( { onChange: setValue, value } );
		const input = getSliderInput();

		expect( input.value ).toBe( '40' );

		rerenderSlider( { onChange: setValue, value: '100%' }, rerender );

		expect( input.value ).toBe( '100' );

		fireEvent.change( input, { target: { value: 13 } } );

		// onChange callback value
		expect( value ).toBe( '13%' );
	} );
} );
