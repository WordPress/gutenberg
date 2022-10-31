/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import FontSizePicker from '../';
import type { FontSize } from '../types';

describe( 'FontSizePicker', () => {
	test.each( [
		// Use units when initial value uses units.
		{ value: '12px', expectedValue: '80px' },
		// Don't use units when initial value does not use units.
		{ value: 12, expectedValue: 80 },
	] )(
		'should call onChange( $expectedValue ) after user types 80 when value is $value',
		async ( { value, expectedValue } ) => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const onChange = jest.fn();
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					value={ value }
					onChange={ onChange }
				/>
			);
			const input = screen.getByLabelText( 'Custom' );
			await user.clear( input );
			await user.type( input, '80' );
			expect( onChange ).toHaveBeenCalledWith( expectedValue );
		}
	);

	test.each( [
		// Use units when first font size uses units.
		{ firstFontSize: '12px', expectedValue: '80px' },
		// Don't use units when first font size does not use units.
		{ firstFontSize: 12, expectedValue: 80 },
	] )(
		'should call onChange( $expectedValue ) after user types 80 when first font size is $firstFontSize',
		async ( { firstFontSize, expectedValue } ) => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const onChange = jest.fn();
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ [ { slug: 'slug', size: firstFontSize } ] }
					onChange={ onChange }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			const input = screen.getByLabelText( 'Custom' );
			await user.clear( input );
			await user.type( input, '80' );
			expect( onChange ).toHaveBeenCalledWith( expectedValue );
		}
	);

	describe( 'with > 5 font sizes', () => {
		const fontSizes = [
			{
				slug: 'tiny',
				name: 'Tiny',
				size: '8px',
			},
			{
				slug: 'small',
				name: 'Small',
				size: '12px',
			},
			{
				slug: 'medium',
				name: 'Medium',
				size: '16px',
			},
			{
				slug: 'large',
				name: 'Large',
				size: '22px',
			},
			{
				slug: 'x-large',
				name: 'Extra Large',
				size: '30px',
			},
			{
				slug: 'xx-large',
				// no name
				size: '40px',
			},
		];

		it( 'displays a select control', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Font size' } )
			);
			const options = screen.getAllByRole( 'option' );
			expect( options[ 0 ] ).toHaveAccessibleName( 'Default' );
			expect( options[ 1 ] ).toHaveAccessibleName( 'Tiny 8' );
			expect( options[ 2 ] ).toHaveAccessibleName( 'Small 12' );
			expect( options[ 3 ] ).toHaveAccessibleName( 'Medium 16' );
			expect( options[ 4 ] ).toHaveAccessibleName( 'Large 22' );
			expect( options[ 5 ] ).toHaveAccessibleName( 'Extra Large 30' );
			expect( options[ 6 ] ).toHaveAccessibleName( 'xx-large 40' );
			expect( options[ 7 ] ).toHaveAccessibleName( 'Custom' );
		} );

		test.each( [
			{ value: undefined, expectedLabel: 'Size' },
			{ value: '8px', expectedLabel: 'Size (8px)' },
			{ value: '3px', expectedLabel: 'Size (Custom)' },
		] )(
			'displays $expectedLabel as label when value is $value',
			( { value, expectedLabel } ) => {
				render(
					<FontSizePicker
						__nextHasNoMarginBottom
						fontSizes={ fontSizes }
						value={ value }
					/>
				);
				expect(
					screen.getByLabelText( expectedLabel )
				).toBeInTheDocument();
			}
		);

		test.each( [
			{ option: 'Default', value: '8px', expectedValue: undefined },
			{ option: 'Small 12', value: '8px', expectedValue: '12px' },
		] )(
			'calls onChange( $expectedValue ) when $option is selected',
			async ( { option, value, expectedValue } ) => {
				const user = userEvent.setup( {
					advanceTimers: jest.advanceTimersByTime,
				} );
				const onChange = jest.fn();
				render(
					<FontSizePicker
						__nextHasNoMarginBottom
						fontSizes={ fontSizes }
						value={ value }
						onChange={ onChange }
					/>
				);
				await user.click(
					screen.getByRole( 'button', { name: 'Font size' } )
				);
				await user.click(
					screen.getByRole( 'option', { name: option } )
				);
				expect( onChange ).toHaveBeenCalledWith( expectedValue );
			}
		);

		it( 'shows custom input when Custom is selected', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const onChange = jest.fn();
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
					onChange={ onChange }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Font size' } )
			);
			await user.click(
				screen.getByRole( 'option', { name: 'Custom' } )
			);
			expect( screen.getByLabelText( 'Custom' ) ).toBeInTheDocument();
			// TODO: onChange() shouldn't be called.
			//expect( onChange ).not.toHaveBeenCalled();
		} );

		commonTests( fontSizes );
	} );

	describe( 'with <= 5 font sizes', () => {
		const fontSizes = [
			{
				slug: 'small',
				// no name
				size: '12px',
			},
			{
				slug: 'medium',
				name: 'Medium',
				size: '16px',
			},
			{
				slug: 'large',
				name: 'Large',
				size: '22px',
			},
			{
				slug: 'huge',
				name: 'Huge',
				size: '30px',
			},
			{
				slug: 'gigantosaurus',
				name: 'Gigantosaurus',
				size: '40px',
			},
		];

		it( 'displays a toggle group control with t-shirt sizes', () => {
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
				/>
			);
			const options = screen.getAllByRole( 'radio' );
			expect( options[ 0 ] ).toHaveTextContent( 'S' );
			expect( options[ 0 ] ).toHaveAccessibleName( 'S' );
			expect( options[ 1 ] ).toHaveTextContent( 'M' );
			expect( options[ 1 ] ).toHaveAccessibleName( 'Medium' );
			expect( options[ 2 ] ).toHaveTextContent( 'L' );
			expect( options[ 2 ] ).toHaveAccessibleName( 'Large' );
			expect( options[ 3 ] ).toHaveTextContent( 'XL' );
			expect( options[ 3 ] ).toHaveAccessibleName( 'Huge' );
			expect( options[ 4 ] ).toHaveTextContent( 'XXL' );
			expect( options[ 4 ] ).toHaveAccessibleName( 'Gigantosaurus' );
		} );

		test.each( [
			{ value: undefined, expectedLabel: 'Size Default' },
			{ value: '12px', expectedLabel: 'Size small(px)' },
			{ value: '40px', expectedLabel: 'Size Gigantosaurus(px)' },
		] )(
			'displays $expectedLabel as label when value is $value',
			( { value, expectedLabel } ) => {
				render(
					<FontSizePicker
						__nextHasNoMarginBottom
						fontSizes={ fontSizes }
						value={ value }
					/>
				);
				expect(
					screen.getByLabelText( expectedLabel )
				).toBeInTheDocument();
			}
		);

		it( 'calls onChange when a font size is selected', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const onChange = jest.fn();
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
					onChange={ onChange }
				/>
			);
			await user.click( screen.getByRole( 'radio', { name: 'Medium' } ) );
			expect( onChange ).toHaveBeenCalledWith( '16px' );
		} );

		commonTests( fontSizes );
	} );

	function commonTests( fontSizes: FontSize[] ) {
		it( 'allows custom values by default', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const onChange = jest.fn();
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
					onChange={ onChange }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			await user.type( screen.getByLabelText( 'Custom' ), '80' );
			expect( onChange ).toHaveBeenCalledWith( '80px' );
		} );

		it( 'does not allow custom values when disableCustomFontSizes is set', () => {
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
					disableCustomFontSizes
				/>
			);
			expect(
				screen.queryByRole( 'button', { name: 'Set custom size' } )
			).not.toBeInTheDocument();
		} );

		it( 'does not display a slider by default', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			expect(
				screen.queryByLabelText( 'Custom Size' )
			).not.toBeInTheDocument();
		} );

		it( 'allows a slider to be used when withSlider is set', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const onChange = jest.fn();
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
					withSlider
					onChange={ onChange }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			const sliderInput = screen.getByLabelText( 'Custom Size' );
			fireEvent.change( sliderInput!, {
				target: { value: 80 },
			} );
			expect( onChange ).toHaveBeenCalledWith( '80px' );
		} );

		it( 'allows reset by default', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const onChange = jest.fn();
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
					value="12px"
					onChange={ onChange }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );
			expect( onChange ).toHaveBeenCalledWith( undefined );
		} );

		it( 'does not allow reset when withReset is false', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			render(
				<FontSizePicker
					__nextHasNoMarginBottom
					fontSizes={ fontSizes }
					value="12px"
					withReset={ false }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			expect(
				screen.queryByRole( 'button', { name: 'Reset' } )
			).not.toBeInTheDocument();
		} );
	}
} );
