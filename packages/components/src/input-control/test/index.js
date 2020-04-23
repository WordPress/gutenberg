/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import InputControl from '../';

describe( 'InputControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			const result = render( <InputControl /> );

			const input = result.container.querySelector( 'input' );

			expect( input ).toBeTruthy();
		} );

		it( 'should render with specified type', () => {
			const result = render( <InputControl type="number" /> );

			const input = result.container.querySelector( '[type="number"]' );

			expect( input ).toBeTruthy();
		} );
	} );

	describe( 'Label', () => {
		it( 'should render label', () => {
			const result = render(
				<InputControl label="Hello" value="There" />
			);

			const input = result.getByText( 'Hello' );

			expect( input ).toBeTruthy();
		} );

		it( 'should render label, if floating', () => {
			const result = render(
				<InputControl isFloatingLabel label="Hello" value="There" />
			);

			const input = result.getAllByText( 'Hello' );

			expect( input ).toBeTruthy();
		} );
	} );
} );
