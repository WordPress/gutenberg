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

const toggleCustomInput = ( showCustomInput ) => {
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
				<FontSizePicker value={ fontSize } onChange={ setFontSize } />
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
				<FontSizePicker value={ fontSize } onChange={ setFontSize } />
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
			it( 'should use numeric labels for simple css values', () => {
				const fontSizes = [ ...options ];
				render(
					<FontSizePicker
						fontSizes={ fontSizes }
						value={ fontSizes[ 0 ].size }
					/>
				);
				const element = screen.getByLabelText( 'Large' );
				expect( element ).toBeInTheDocument();
				expect( element.children[ 0 ].textContent ).toBe( '1.7' );
			} );
			it( 'should use incremental sequence of numbers as labels if we have complex css', () => {
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
					/>
				);
				const element = screen.getByLabelText( 'Large' );
				expect( element ).toBeInTheDocument();
				expect( element.children[ 0 ].textContent ).toBe( '3' );
			} );
		} );
	} );
} );
