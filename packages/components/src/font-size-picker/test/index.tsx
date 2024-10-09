/**
 * External dependencies
 */
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import FontSizePicker from '../';
import type { FontSize } from '../types';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

const ControlledFontSizePicker = ( {
	onChange,
	...props
}: React.ComponentProps< typeof FontSizePicker > ) => {
	const [ fontSize, setFontSize ] =
		useState< typeof props.value >( undefined );

	return (
		<FontSizePicker
			{ ...props }
			value={ fontSize }
			onChange={ ( newFontSize ) => {
				setFontSize( newFontSize );
				onChange?.( newFontSize );
			} }
		/>
	);
};

describe( 'FontSizePicker', () => {
	test.each( [
		// Use units when initial value uses units.
		{ value: '12px', expectedValue: '80px' },
		// Don't use units when initial value does not use units.
		{ value: 12, expectedValue: 80 },
	] )(
		'should call onChange( $expectedValue ) after user types 80 when value is $value',
		async ( { value, expectedValue } ) => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePicker value={ value } onChange={ onChange } />
			);
			const input = screen.getByLabelText( 'Custom' );
			await user.clear( input );
			await user.type( input, '80' );
			expect( onChange ).toHaveBeenCalledTimes( 3 ); // Once for the clear, then once per keystroke.
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
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePicker
					fontSizes={ [ { slug: 'slug', size: firstFontSize } ] }
					onChange={ onChange }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			const input = screen.getByLabelText( 'Custom' );
			await user.type( input, '80' );
			expect( onChange ).toHaveBeenCalledTimes( 2 ); // Once per keystroke.
			expect( onChange ).toHaveBeenCalledWith( expectedValue );
		}
	);

	describe( 'with > 5 homogeneous font sizes', () => {
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
				size: '20px',
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
			const user = userEvent.setup();
			await render( <FontSizePicker fontSizes={ fontSizes } /> );
			await user.click(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			);
			const options = screen.getAllByRole( 'option' );
			expect( options ).toHaveLength( 8 );
			expect( options[ 0 ] ).toHaveAccessibleName( 'Default' );
			expect( options[ 1 ] ).toHaveAccessibleName( 'Tiny 8' );
			expect( options[ 2 ] ).toHaveAccessibleName( 'Small 12' );
			expect( options[ 3 ] ).toHaveAccessibleName( 'Medium 16' );
			expect( options[ 4 ] ).toHaveAccessibleName( 'Large 20' );
			expect( options[ 5 ] ).toHaveAccessibleName( 'Extra Large 30' );
			expect( options[ 6 ] ).toHaveAccessibleName( 'xx-large 40' );
			expect( options[ 7 ] ).toHaveAccessibleName( 'Custom' );
		} );

		test.each( [
			{ value: undefined, expectedLabel: 'Size (px)' },
			{ value: '8px', expectedLabel: 'Size (px)' },
			{ value: '3px', expectedLabel: 'Size Custom' },
		] )(
			'displays $expectedLabel as label when value is $value',
			async ( { value, expectedLabel } ) => {
				await render(
					<FontSizePicker fontSizes={ fontSizes } value={ value } />
				);
				expect( screen.getByLabelText( expectedLabel ) ).toBeVisible();
			}
		);

		test.each( [
			{
				option: 'Default',
				value: '8px',
				expectedArguments: [ undefined ],
			},
			{
				option: 'Tiny 8',
				value: undefined,
				expectedArguments: [ '8px', fontSizes[ 0 ] ],
			},
		] )(
			'calls onChange( $expectedArguments ) when $option is selected',
			async ( { option, value, expectedArguments } ) => {
				const user = userEvent.setup();
				const onChange = jest.fn();
				await render(
					<FontSizePicker
						fontSizes={ fontSizes }
						value={ value }
						onChange={ onChange }
					/>
				);
				await user.click(
					screen.getByRole( 'combobox', { name: 'Font size' } )
				);
				await user.click(
					screen.getByRole( 'option', { name: option } )
				);
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChange ).toHaveBeenCalledWith( ...expectedArguments );
			}
		);

		commonSelectTests( fontSizes );
		commonTests( fontSizes );
	} );

	describe( 'with > 5 heterogeneous font sizes', () => {
		const fontSizes = [
			{
				slug: 'tiny',
				name: 'Tiny',
				size: '8px',
			},
			{
				slug: 'small',
				name: 'Small',
				size: '1em',
			},
			{
				slug: 'medium',
				name: 'Medium',
				size: '2rem',
			},
			{
				slug: 'large',
				name: 'Large',
				size: 'clamp(1.75rem, 3vw, 2.25rem)',
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
			const user = userEvent.setup();
			await render( <FontSizePicker fontSizes={ fontSizes } /> );
			await user.click(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			);
			const options = screen.getAllByRole( 'option' );
			expect( options ).toHaveLength( 8 );
			expect( options[ 0 ] ).toHaveAccessibleName( 'Default' );
			expect( options[ 1 ] ).toHaveAccessibleName( 'Tiny 8px' );
			expect( options[ 2 ] ).toHaveAccessibleName( 'Small 1em' );
			expect( options[ 3 ] ).toHaveAccessibleName( 'Medium 2rem' );
			expect( options[ 4 ] ).toHaveAccessibleName( 'Large' );
			expect( options[ 5 ] ).toHaveAccessibleName( 'Extra Large 30px' );
			expect( options[ 6 ] ).toHaveAccessibleName( 'xx-large 40px' );
			expect( options[ 7 ] ).toHaveAccessibleName( 'Custom' );
		} );

		test.each( [
			{ value: undefined, option: 'Default' },
			{ value: '', option: 'Default' },
			{ value: '8px', option: 'Tiny' },
		] )(
			'defaults to $option when value is $value',
			async ( { value, option } ) => {
				await render(
					<FontSizePicker fontSizes={ fontSizes } value={ value } />
				);
				expect(
					screen.getByRole( 'combobox', { name: 'Font size' } )
				).toHaveTextContent( option );
			}
		);

		test.each( [
			{ value: undefined, expectedLabel: 'Size' },
			{ value: '8px', expectedLabel: 'Size' },
			{ value: '1em', expectedLabel: 'Size' },
			{ value: '2rem', expectedLabel: 'Size' },
			{ value: 'clamp(1.75rem, 3vw, 2.25rem)', expectedLabel: 'Size' },
			{ value: '3px', expectedLabel: 'Size Custom' },
		] )(
			'displays $expectedLabel as label when value is $value',
			async ( { value, expectedLabel } ) => {
				await render(
					<FontSizePicker fontSizes={ fontSizes } value={ value } />
				);
				expect( screen.getByLabelText( expectedLabel ) ).toBeVisible();
			}
		);

		test.each( [
			{
				option: 'Default',
				value: '8px',
				expectedArguments: [ undefined ],
			},
			{
				option: 'Tiny 8px',
				value: undefined,
				expectedArguments: [ '8px', fontSizes[ 0 ] ],
			},
			{
				option: 'Small 1em',
				value: '8px',
				expectedArguments: [ '1em', fontSizes[ 1 ] ],
			},
			{
				option: 'Medium 2rem',
				value: '8px',
				expectedArguments: [ '2rem', fontSizes[ 2 ] ],
			},
			{
				option: 'Large',
				value: '8px',
				expectedArguments: [
					'clamp(1.75rem, 3vw, 2.25rem)',
					fontSizes[ 3 ],
				],
			},
		] )(
			'calls onChange( $expectedValue ) when $option is selected',
			async ( { option, value, expectedArguments } ) => {
				const user = userEvent.setup();
				const onChange = jest.fn();
				await render(
					<FontSizePicker
						fontSizes={ fontSizes }
						value={ value }
						onChange={ onChange }
					/>
				);
				await user.click(
					screen.getByRole( 'combobox', { name: 'Font size' } )
				);
				await user.click(
					screen.getByRole( 'option', { name: option } )
				);
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChange ).toHaveBeenCalledWith( ...expectedArguments );
			}
		);

		commonSelectTests( fontSizes );
		commonTests( fontSizes );
	} );

	describe( 'with ≤ 5 homogeneous font sizes', () => {
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

		it( 'displays a toggle group control with t-shirt sizes', async () => {
			await render( <FontSizePicker fontSizes={ fontSizes } /> );
			const options = screen.getAllByRole( 'radio' );
			expect( options ).toHaveLength( 5 );
			expect( options[ 0 ] ).toHaveTextContent( 'S' );
			expect( options[ 0 ] ).toHaveAccessibleName( 'Small' );
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
			{ value: undefined, expectedLabel: 'Size' },
			{ value: '12px', expectedLabel: 'Size Small' },
			{ value: '40px', expectedLabel: 'Size Gigantosaurus' },
		] )(
			'displays $expectedLabel as label when value is $value',
			async ( { value, expectedLabel } ) => {
				await render(
					<FontSizePicker fontSizes={ fontSizes } value={ value } />
				);
				expect( screen.getByLabelText( expectedLabel ) ).toBeVisible();
			}
		);

		it( 'calls onChange when a font size is selected', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePicker fontSizes={ fontSizes } onChange={ onChange } />
			);
			await user.click( screen.getByRole( 'radio', { name: 'Medium' } ) );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( '16px', fontSizes[ 1 ] );
		} );

		commonToggleGroupTests( fontSizes );
		commonTests( fontSizes );
	} );

	describe( 'with ≤ 5 heterogeneous font sizes', () => {
		const fontSizes = [
			{
				slug: 'small',
				name: 'Small',
				size: '12px',
			},
			{
				slug: 'medium',
				name: 'Medium',
				size: '1em',
			},
			{
				slug: 'large',
				name: 'Large',
				size: '2rem',
			},
			{
				slug: 'x-large',
				name: 'Extra Large',
				size: 'clamp(1.75rem, 3vw, 2.25rem)',
			},
		];

		it( 'displays a toggle group control with t-shirt sizes', async () => {
			await render( <FontSizePicker fontSizes={ fontSizes } /> );
			const options = screen.getAllByRole( 'radio' );
			expect( options ).toHaveLength( 4 );
			expect( options[ 0 ] ).toHaveTextContent( 'S' );
			expect( options[ 0 ] ).toHaveAccessibleName( 'Small' );
			expect( options[ 1 ] ).toHaveTextContent( 'M' );
			expect( options[ 1 ] ).toHaveAccessibleName( 'Medium' );
			expect( options[ 2 ] ).toHaveTextContent( 'L' );
			expect( options[ 2 ] ).toHaveAccessibleName( 'Large' );
			expect( options[ 3 ] ).toHaveTextContent( 'XL' );
			expect( options[ 3 ] ).toHaveAccessibleName( 'Extra Large' );
		} );

		test.each( [
			{ value: undefined, expectedLabel: 'Size' },
			{ value: '12px', expectedLabel: 'Size Small' },
			{ value: '1em', expectedLabel: 'Size Medium' },
			{ value: '2rem', expectedLabel: 'Size Large' },
			{
				value: 'clamp(1.75rem, 3vw, 2.25rem)',
				expectedLabel: 'Size Extra Large',
			},
		] )(
			'displays $expectedLabel as label when value is $value',
			async ( { value, expectedLabel } ) => {
				await render(
					<FontSizePicker fontSizes={ fontSizes } value={ value } />
				);
				expect( screen.getByLabelText( expectedLabel ) ).toBeVisible();
			}
		);

		test.each( [
			{ radio: 'Small', expectedArguments: [ '12px', fontSizes[ 0 ] ] },
			{ radio: 'Medium', expectedArguments: [ '1em', fontSizes[ 1 ] ] },
			{ radio: 'Large', expectedArguments: [ '2rem', fontSizes[ 2 ] ] },
			{
				radio: 'Extra Large',
				expectedArguments: [
					'clamp(1.75rem, 3vw, 2.25rem)',
					fontSizes[ 3 ],
				],
			},
		] )(
			'calls onChange( $expectedArguments ) when $radio is selected',
			async ( { radio, expectedArguments } ) => {
				const user = userEvent.setup();
				const onChange = jest.fn();
				await render(
					<FontSizePicker
						fontSizes={ fontSizes }
						onChange={ onChange }
					/>
				);
				await user.click(
					screen.getByRole( 'radio', { name: radio } )
				);
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChange ).toHaveBeenCalledWith( ...expectedArguments );
			}
		);

		commonToggleGroupTests( fontSizes );
		commonTests( fontSizes );
	} );

	function commonToggleGroupTests( fontSizes: FontSize[] ) {
		it( 'defaults to M when value is 16px', async () => {
			await render(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSizes[ 0 ].size }
				/>
			);
			expect(
				screen.getByRole( 'radio', { checked: true } )
			).toHaveTextContent( 'S' );
		} );

		test.each( [ undefined, '' ] )(
			'has no selection when value is %p',
			async ( value ) => {
				await render(
					<FontSizePicker fontSizes={ fontSizes } value={ value } />
				);
				expect( screen.getByRole( 'radiogroup' ) ).toBeVisible();
				expect(
					screen.queryByRole( 'radio', { checked: true } )
				).not.toBeInTheDocument();
			}
		);
	}

	function commonSelectTests( fontSizes: FontSize[] ) {
		it( 'shows custom input when Custom is selected', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePicker fontSizes={ fontSizes } onChange={ onChange } />
			);
			await user.click(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			);
			await user.click(
				screen.getByRole( 'option', { name: 'Custom' } )
			);
			expect( screen.getByLabelText( 'Custom' ) ).toBeVisible();
			expect( onChange ).not.toHaveBeenCalled();
		} );
	}

	function commonTests( fontSizes: FontSize[] ) {
		it( 'shows custom input when value is unknown', async () => {
			await render(
				<FontSizePicker fontSizes={ fontSizes } value="3px" />
			);
			expect( screen.getByLabelText( 'Custom' ) ).toBeVisible();
		} );

		it( 'hides custom input when disableCustomFontSizes is set to `true` with a custom font size', async () => {
			const { rerender } = await render(
				<FontSizePicker fontSizes={ fontSizes } value="3px" />
			);
			expect( screen.getByLabelText( 'Custom' ) ).toBeVisible();

			rerender(
				<FontSizePicker
					disableCustomFontSizes
					fontSizes={ fontSizes }
					value="3px"
				/>
			);
			expect(
				screen.queryByLabelText( 'Custom' )
			).not.toBeInTheDocument();
		} );

		it( "doesn't hide custom input when the selected font size is a predef", async () => {
			const { rerender } = await render(
				<FontSizePicker fontSizes={ fontSizes } value="3px" />
			);
			expect( screen.getByLabelText( 'Custom' ) ).toBeVisible();

			rerender(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSizes[ 0 ].size }
				/>
			);
			expect( screen.getByLabelText( 'Custom' ) ).toBeVisible();
		} );

		it( 'allows custom values by default', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePicker fontSizes={ fontSizes } onChange={ onChange } />
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			await user.type( screen.getByLabelText( 'Custom' ), '80' );
			expect( onChange ).toHaveBeenCalledTimes( 2 ); // Once per keystroke.
			expect( onChange ).toHaveBeenCalledWith( '80px' );
		} );

		it( 'allows switching between custom and predef inputs when pressing the dedicated toggle', async () => {
			const user = userEvent.setup();

			await render(
				<ControlledFontSizePicker fontSizes={ fontSizes } />
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);

			await user.type( screen.getByLabelText( 'Custom' ), '80' );

			await user.click(
				screen.getByRole( 'button', { name: 'Use size preset' } )
			);

			expect(
				screen.queryByLabelText( 'Custom' )
			).not.toBeInTheDocument();
		} );

		it( 'does not allow custom values when disableCustomFontSizes is set', async () => {
			await render(
				<FontSizePicker
					fontSizes={ fontSizes }
					disableCustomFontSizes
				/>
			);
			expect(
				screen.queryByRole( 'button', { name: 'Set custom size' } )
			).not.toBeInTheDocument();
		} );

		it( 'does not display a slider by default', async () => {
			const user = userEvent.setup();
			await render( <FontSizePicker fontSizes={ fontSizes } /> );
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			expect(
				screen.queryByLabelText( 'Custom Size' )
			).not.toBeInTheDocument();
		} );

		it( 'allows a slider to be used when withSlider is set', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePicker
					fontSizes={ fontSizes }
					withSlider
					onChange={ onChange }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
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
			await render(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSizes[ 0 ].size }
					onChange={ onChange }
				/>
			);
			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);
			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( undefined );
		} );

		it( 'does not allow reset when withReset is false', async () => {
			const user = userEvent.setup();
			await render(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSizes[ 0 ].size }
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

		it( 'applies custom units to custom font size control', async () => {
			const user = userEvent.setup();

			await render(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSizes[ 0 ].size }
					units={ [ 'px', 'ch', 'ex' ] }
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Set custom size' } )
			);

			const units = screen.getAllByRole( 'option' );
			expect( units ).toHaveLength( 3 );
			expect( units[ 0 ] ).toHaveAccessibleName( 'px' );
			expect( units[ 1 ] ).toHaveAccessibleName( 'ch' );
			expect( units[ 2 ] ).toHaveAccessibleName( 'ex' );
		} );
	}
} );
