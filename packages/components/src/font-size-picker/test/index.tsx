/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import FontSizePicker from '../';

const getUnitSelect = () =>
	document.body.querySelector( '.components-unit-control select' );
const getUnitLabel = () =>
	document.body.querySelector( '.components-unit-control__unit-label' );

const toggleCustomInput = ( showCustomInput: boolean ) => {
	const label = showCustomInput ? 'Set custom size' : 'Use size preset';
	const toggleCustom = screen.getByLabelText( label, { selector: 'button' } );
	fireEvent.click( toggleCustom );
};

describe( 'FontSizePicker', () => {
	describe( 'onChange values', () => {
		it( 'should not use units when the initial value is a number', () => {
			let fontSize = 12;
			const setFontSize = jest.fn(
				( nextSize ) => ( fontSize = nextSize )
			);

			render(
				<FontSizePicker
					value={ fontSize }
					onChange={ setFontSize }
					__nextHasNoMarginBottom
				/>
			);

			const unitSelect = getUnitSelect();
			const unitLabel = getUnitLabel();
			const input = screen.getByLabelText( 'Custom', {
				selector: 'input',
			} );

			input.focus();
			fireEvent.change( input, { target: { value: 16 } } );

			expect( unitSelect ).toBeFalsy();
			expect( unitLabel ).toBeTruthy();
			expect( fontSize ).toBe( 16 );
		} );

		it( 'should use units when the initial value has a unit', () => {
			let fontSize = '12px';
			const setFontSize = jest.fn(
				( nextSize ) => ( fontSize = nextSize )
			);

			render(
				<FontSizePicker
					value={ fontSize }
					onChange={ setFontSize }
					__nextHasNoMarginBottom
				/>
			);

			const unitSelect = getUnitSelect();
			const unitLabel = getUnitLabel();
			const input = screen.getByLabelText( 'Custom', {
				selector: 'input',
			} );

			input.focus();
			fireEvent.change( input, { target: { value: 16 } } );

			expect( unitSelect ).toBeTruthy();
			expect( unitLabel ).toBeFalsy();
			expect( fontSize ).toBe( '16px' );
		} );

		it( 'should not use units when fontSizes size values are numbers', () => {
			let fontSize;
			const fontSizes = [
				{
					name: 'Small',
					slug: 'small',
					size: 12,
				},
			];
			const setFontSize = jest.fn(
				( nextSize ) => ( fontSize = nextSize )
			);

			render(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSize }
					onChange={ setFontSize }
					__nextHasNoMarginBottom
				/>
			);

			toggleCustomInput( true );
			const unitSelect = getUnitSelect();
			const unitLabel = getUnitLabel();
			const input = screen.getByLabelText( 'Custom', {
				selector: 'input',
			} );

			input.focus();
			fireEvent.change( input, { target: { value: 16 } } );

			expect( unitSelect ).toBeFalsy();
			expect( unitLabel ).toBeTruthy();
			expect( fontSize ).toBe( 16 );
		} );

		it( 'should use units when fontSizes size values have units', () => {
			let fontSize;
			const fontSizes = [
				{
					name: 'Small',
					slug: 'small',
					size: '12px',
				},
			];
			const setFontSize = jest.fn(
				( nextSize ) => ( fontSize = nextSize )
			);

			render(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSize }
					onChange={ setFontSize }
					__nextHasNoMarginBottom
				/>
			);

			toggleCustomInput( true );
			const unitSelect = getUnitSelect();
			const unitLabel = getUnitLabel();
			const input = screen.getByLabelText( 'Custom', {
				selector: 'input',
			} );

			input.focus();
			fireEvent.change( input, { target: { value: 16 } } );

			expect( unitSelect ).toBeTruthy();
			expect( unitLabel ).toBeFalsy();
			expect( fontSize ).toBe( '16px' );
		} );
	} );
	describe( 'renders different control', () => {
		const options = [
			{
				name: 'Small',
				slug: 'small',
				size: '0.65rem',
			},
			{
				name: 'Medium',
				slug: 'medium',
				size: '1.125rem',
			},
			{
				name: 'Large',
				slug: 'large',
				size: '1.7rem',
			},
		];
		it( 'should render select control when we have more than five font sizes', () => {
			const extraOptions = [
				{
					name: 'Extra Large',
					slug: 'extra-large',
					size: '1.95rem',
				},
				{
					name: 'Extra Extra Large',
					slug: 'extra-extra-large',
					size: '2.5rem',
				},
				{
					name: 'Huge',
					slug: 'huge',
					size: '2.8rem',
				},
			];
			const fontSizes = [ ...options, ...extraOptions ];
			render(
				<FontSizePicker
					fontSizes={ fontSizes }
					value={ fontSizes[ 0 ].size }
					__nextHasNoMarginBottom
				/>
			);
			// Trigger click to open the select menu and take into account
			// the two extra options (default, custom);
			fireEvent.click(
				screen.getByLabelText( 'Font size', { selector: 'button' } )
			);
			const element = screen.getAllByRole( 'option' );
			expect( element ).toHaveLength( fontSizes.length + 2 );
		} );
		describe( 'segmented control', () => {
			it( 'should use t-shirt labels for simple css values', () => {
				const fontSizes = [ ...options ];
				render(
					<FontSizePicker
						fontSizes={ fontSizes }
						value={ fontSizes[ 0 ].size }
						__nextHasNoMarginBottom
					/>
				);
				const element = screen.getByLabelText( 'Large' );
				expect( element ).toBeInTheDocument();
				expect( element.children[ 0 ] ).toHaveTextContent( 'L' );
			} );
			it( 'should use incremental sequence of t-shirt sizes as labels if we have complex css', () => {
				const fontSizes = [
					...options,
					{
						name: 'Extra Large',
						slug: 'extra-large',
						size: 'clamp(1.75rem, 3vw, 2.25rem)',
					},
				];
				render(
					<FontSizePicker
						fontSizes={ fontSizes }
						value={ fontSizes[ 0 ].size }
						__nextHasNoMarginBottom
					/>
				);
				const largeElement = screen.getByLabelText( 'Large' );
				expect( largeElement ).toBeInTheDocument();
				expect( largeElement ).toHaveTextContent( 'L' );

				const extraLargeElement =
					screen.getByLabelText( 'Extra Large' );
				expect( extraLargeElement ).toBeInTheDocument();
				expect( extraLargeElement.children[ 0 ] ).toHaveTextContent(
					'XL'
				);
			} );
			it( 'should use font size `slug` for for header hint label by default', () => {
				const fontSizes = [
					{
						name: 'Allosaurus Large',
						slug: 'allosaurus-l',
						size: '20rem',
					},
				];
				render(
					<FontSizePicker
						fontSizes={ fontSizes }
						value={ fontSizes[ 0 ].size }
						__nextHasNoMarginBottom
					/>
				);

				const largeFontSizeElement = screen.getByLabelText(
					'Size Allosaurus Large(rem)'
				);
				expect( largeFontSizeElement ).toBeInTheDocument();
			} );
			it( 'should fallback to font size `slug` for header hint label if `name` is undefined', () => {
				const fontSizes = [
					{
						slug: 'gigantosaurus',
						size: '1000px',
					},
				];
				render(
					<FontSizePicker
						fontSizes={ fontSizes }
						value={ fontSizes[ 0 ].size }
						__nextHasNoMarginBottom
					/>
				);

				const giganticFontSizeElement = screen.getByLabelText(
					'Size gigantosaurus(px)'
				);
				expect( giganticFontSizeElement ).toBeInTheDocument();
			} );
		} );
	} );
} );
