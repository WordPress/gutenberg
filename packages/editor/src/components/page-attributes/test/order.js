/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';
import { Simulate } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import { PageAttributesOrder } from '../order';

describe( 'PageAttributesOrder', () => {
	it( 'should reject invalid input', () => {
		const onUpdateOrder = jest.fn();
		let container;
		act( () => {
			container = render(
				<PageAttributesOrder onUpdateOrder={ onUpdateOrder } />
			).container;
		} );
		const input = container.querySelector( 'input' );
		act( () => {
			Simulate.change( input, { target: { value: 'bad' } } );
			Simulate.change( input, { target: { value: '----+++' } } );
			Simulate.change( input, { target: { value: '-' } } );
			Simulate.change( input, { target: { value: '+' } } );
			Simulate.change( input, { target: { value: '' } } );
			Simulate.change( input, { target: { value: ' ' } } );
		} );

		expect( onUpdateOrder ).not.toHaveBeenCalled();
	} );

	it( 'should update with zero input', () => {
		const onUpdateOrder = jest.fn();
		let container;
		act( () => {
			container = render(
				<PageAttributesOrder onUpdateOrder={ onUpdateOrder } />
			).container;
		} );
		const input = container.querySelector( 'input' );
		act( () => {
			Simulate.change( input, { target: { value: 0 } } );
		} );
		expect( onUpdateOrder ).toHaveBeenCalledWith( 0 );
	} );

	it( 'should update with valid positive input', () => {
		const onUpdateOrder = jest.fn();
		let container;
		act( () => {
			container = render(
				<PageAttributesOrder onUpdateOrder={ onUpdateOrder } />
			).container;
		} );
		const input = container.querySelector( 'input' );
		act( () => {
			Simulate.change( input, { target: { value: '4' } } );
		} );

		expect( onUpdateOrder ).toHaveBeenCalledWith( 4 );
	} );

	it( 'should update with valid negative input', () => {
		const onUpdateOrder = jest.fn();
		let container;
		act( () => {
			container = render(
				<PageAttributesOrder onUpdateOrder={ onUpdateOrder } />
			).container;
		} );
		const input = container.querySelector( 'input' );
		act( () => {
			Simulate.change( input, { target: { value: '-1' } } );
		} );

		expect( onUpdateOrder ).toHaveBeenCalledWith( -1 );
	} );
} );
