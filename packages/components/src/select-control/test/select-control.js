/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import SelectControl from '..';

describe( 'SelectControl', () => {
	it( 'should not render when no options or children are provided', () => {
		const { container } = render( <SelectControl /> );

		expect( container.firstChild ).toBeNull();
	} );

	it( 'should not render its children', async () => {
		const handleChangeMock = jest.fn();

		render(
			<SelectControl onChange={ handleChangeMock } label="Select">
				<option value="option-1">Option 1</option>
				<option value="option-2">Option 2</option>
				<optgroup label="Option Group">
					<option value="option-group-option-1">
						Option Group - Option 1
					</option>
				</optgroup>
			</SelectControl>
		);

		expect( screen.getByText( 'Option 1' ) ).toBeInTheDocument();

		const selectElement = screen.queryByLabelText( 'Select' );

		fireEvent.change( selectElement, {
			target: { value: 'option-group-option-1' },
		} );

		expect( handleChangeMock ).toHaveBeenCalledWith(
			'option-group-option-1',
			expect.anything()
		);
	} );

	it( 'should not render its options', async () => {
		const handleChangeMock = jest.fn();

		render(
			<SelectControl
				label="Select"
				onChange={ handleChangeMock }
				options={ [
					{
						id: 'option-1',
						value: 'option-1',
						label: 'Option 1',
					},
					{
						id: 'option-2',
						value: 'option-2',
						label: 'Option 2',
					},
				] }
			/>
		);

		expect( screen.getByText( 'Option 1' ) ).toBeInTheDocument();

		const selectElement = screen.queryByLabelText( 'Select' );

		fireEvent.change( selectElement, {
			target: { value: 'option-2' },
		} );

		expect( handleChangeMock ).toHaveBeenCalledWith(
			'option-2',
			expect.anything()
		);
	} );
} );
