/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import _SelectControl from '..';

const SelectControl = (
	props: React.ComponentProps< typeof _SelectControl >
) => {
	return <_SelectControl { ...props } __nextHasNoMarginBottom />;
};

describe( 'SelectControl', () => {
	it( 'should not render when no options or children are provided', () => {
		render( <SelectControl /> );

		// use `queryByRole` to avoid throwing an error with `getByRole`
		expect( screen.queryByRole( 'combobox' ) ).not.toBeInTheDocument();
	} );

	it( 'should render its children', async () => {
		const user = userEvent.setup();
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

		expect(
			screen.getByRole( 'option', { name: 'Option 1' } )
		).toBeInTheDocument();

		const selectElement = screen.getByRole( 'combobox' );
		await user.selectOptions( selectElement, 'option-group-option-1' );

		expect( handleChangeMock ).toHaveBeenCalledWith(
			'option-group-option-1',
			expect.anything()
		);
	} );

	it( 'should render its options', async () => {
		const user = userEvent.setup();
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

		expect(
			screen.getByRole( 'option', { name: 'Option 1' } )
		).toBeInTheDocument();

		const selectElement = screen.getByRole( 'combobox' );
		await user.selectOptions( selectElement, 'option-2' );

		expect( handleChangeMock ).toHaveBeenCalledWith(
			'option-2',
			expect.anything()
		);
	} );

	it( 'should pass through options props', () => {
		render(
			<SelectControl
				label="Select"
				options={ [
					{
						value: 'value',
						label: 'label',
						'aria-label': 'Aria label',
					},
				] }
			/>
		);

		expect(
			screen.getByRole( 'option', { name: 'Aria label' } )
		).toBeInTheDocument();
	} );

	/* eslint-disable jest/expect-expect */
	describe( 'static typing', () => {
		describe( 'single', () => {
			it( 'should infer the value type from available `options`, but not the `value` or `onChange` prop', () => {
				const onChange: ( value: 'foo' | 'bar' ) => void = () => {};

				<SelectControl
					value="narrow"
					options={ [
						{
							value: 'narrow',
							label: 'Narrow',
						},
						{
							value: 'value',
							label: 'Value',
						},
					] }
					// @ts-expect-error onChange type is not compatible with inferred value type
					onChange={ onChange }
				/>;

				<_SelectControl
					// @ts-expect-error "string" is not "narrow" or "value"
					value="string"
					options={ [
						{
							value: 'narrow',
							label: 'Narrow',
						},
						{
							value: 'value',
							label: 'Value',
						},
					] }
					// @ts-expect-error "string" is not "narrow" or "value"
					onChange={ ( value ) => value === 'string' }
				/>;
			} );

			it( 'should accept an explicit type argument', () => {
				<_SelectControl< 'narrow' | 'value' >
					// @ts-expect-error "string" is not "narrow" or "value"
					value="string"
					options={ [
						{
							value: 'narrow',
							label: 'Narrow',
						},
						{
							// @ts-expect-error "string" is not "narrow" or "value"
							value: 'string',
							label: 'String',
						},
					] }
				/>;
			} );
		} );

		describe( 'multiple', () => {
			it( 'should infer the value type from available `options`, but not the `value` or `onChange` prop', () => {
				const onChange: (
					value: ( 'foo' | 'bar' )[]
				) => void = () => {};

				<_SelectControl
					multiple
					value={ [ 'narrow' ] }
					options={ [
						{
							value: 'narrow',
							label: 'Narrow',
						},
						{
							value: 'value',
							label: 'Value',
						},
					] }
					// @ts-expect-error onChange type is not compatible with inferred value type
					onChange={ onChange }
				/>;

				<_SelectControl
					multiple
					// @ts-expect-error "string" is not "narrow" or "value"
					value={ [ 'string' ] }
					options={ [
						{
							value: 'narrow',
							label: 'Narrow',
						},
						{
							value: 'value',
							label: 'Value',
						},
					] }
					onChange={ ( value ) =>
						// @ts-expect-error "string" is not "narrow" or "value"
						value.forEach( ( v ) => v === 'string' )
					}
				/>;
			} );

			it( 'should accept an explicit type argument', () => {
				<_SelectControl< 'narrow' | 'value' >
					multiple
					// @ts-expect-error "string" is not "narrow" or "value"
					value={ [ 'string' ] }
					options={ [
						{
							value: 'narrow',
							label: 'Narrow',
						},
						{
							// @ts-expect-error "string" is not "narrow" or "value"
							value: 'string',
							label: 'String',
						},
					] }
				/>;
			} );
		} );
	} );
	/* eslint-enable jest/expect-expect */
} );
