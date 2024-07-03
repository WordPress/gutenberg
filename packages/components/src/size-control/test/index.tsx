/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import SizeControl from '../';

describe( 'SizeControl', () => {
	test.each( [
		// Use units when initial value uses units.
		{ value: '12px', expectedValue: '80px' },
		// Use a different unit than the default px.
		{ value: '12em', expectedValue: '80em' },
		// Don't use units when initial value does not use units.
		{ value: 12, expectedValue: 80, hasUnit: false },
	] )(
		'should call onChange( $expectedValue ) after user types 80 when value is $value',
		async ( { value, expectedValue, hasUnit } ) => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			render(
				<SizeControl
					value={ value }
					onChange={ onChange }
					label="Size Control"
					hasUnit={ hasUnit }
				/>
			);
			const input = screen.getByLabelText( 'Size Control' );
			await user.clear( input );
			await user.type( input, '80' );
			expect( onChange ).toHaveBeenCalledTimes( 3 ); // Once for the clear, then once per keystroke.
			expect( onChange ).toHaveBeenCalledWith( expectedValue );
		}
	);

	it( 'does not display a slider when withSlider is false', async () => {
		render( <SizeControl withSlider={ false } /> );
		expect(
			screen.queryByLabelText( 'Custom Size' )
		).not.toBeInTheDocument();
	} );

	it( 'allows a slider by default', async () => {
		const onChange = jest.fn();
		render( <SizeControl value="16px" onChange={ onChange } /> );

		const sliderInput = screen.getByLabelText( 'Custom Size' );
		fireEvent.change( sliderInput, {
			target: { value: 80 },
		} );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( '80px' );
	} );

	it( 'allows reset by default', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render( <SizeControl value="16px" onChange={ onChange } /> );
		await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( undefined );
	} );

	it( 'does not allow reset when withReset is false', async () => {
		render( <SizeControl withReset={ false } /> );
		expect(
			screen.queryByRole( 'button', { name: 'Reset' } )
		).not.toBeInTheDocument();
	} );
} );
