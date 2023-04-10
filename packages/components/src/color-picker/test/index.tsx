/**
 * External dependencies
 */
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { ColorPicker } from '..';

function getFormatSelector( container: HTMLElement ) {
	return container.querySelector( '.components-select-control__input' );
}

function getInputByClass(
	container: HTMLElement,
	className: string
): HTMLInputElement | null {
	return container.querySelector( className );
}

const hslaMatcher = expect.objectContaining( {
	h: expect.any( Number ),
	s: expect.any( Number ),
	l: expect.any( Number ),
	a: expect.any( Number ),
} );

const legacyColorMatcher = {
	hex: expect.any( String ),
	hsl: hslaMatcher,
	hsv: expect.objectContaining( {
		h: expect.any( Number ),
		s: expect.any( Number ),
		v: expect.any( Number ),
		a: expect.any( Number ),
	} ),
	rgb: expect.objectContaining( {
		r: expect.any( Number ),
		g: expect.any( Number ),
		b: expect.any( Number ),
		a: expect.any( Number ),
	} ),
	oldHue: expect.any( Number ),
	source: 'hex',
};

describe( 'ColorPicker', () => {
	describe( 'legacy props', () => {
		it( 'should fire onChangeComplete with the legacy color format', async () => {
			const user = userEvent.setup();
			const onChangeComplete = jest.fn();
			const color = '#000';

			const { container } = render(
				<ColorPicker
					onChangeComplete={ onChangeComplete }
					color={ color }
					enableAlpha={ false }
				/>
			);

			const formatSelector = getFormatSelector( container );

			if ( formatSelector === null ) {
				throw new Error(
					'The color format selector could not be found'
				);
			}

			expect( formatSelector ).toBeInTheDocument();

			await user.selectOptions( formatSelector, 'hex' );

			const hexInput = getInputByClass(
				container,
				'.components-base-control.components-input-control input'
			);

			if ( hexInput === null ) {
				throw new Error(
					'The color format selector could not be found'
				);
			}

			expect( hexInput ).toBeInTheDocument();

			await user.clear( hexInput );
			await user.type( hexInput, '1ab' );

			expect( onChangeComplete ).toHaveBeenCalledTimes( 3 );
			expect( onChangeComplete ).toHaveBeenLastCalledWith(
				legacyColorMatcher
			);
		} );
	} );
	describe( 'Hex input', () => {
		it( 'should fire onChange with the correct value from the hex input', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const color = '#000';

			const { container } = render(
				<ColorPicker
					onChange={ onChange }
					color={ color }
					enableAlpha={ false }
				/>
			);

			const formatSelector = getFormatSelector( container );

			if ( formatSelector === null ) {
				throw new Error(
					'The color format selector could not be found'
				);
			}

			expect( formatSelector ).toBeInTheDocument();

			await user.selectOptions( formatSelector, 'hex' );

			const hexInput = getInputByClass(
				container,
				'.components-base-control.components-input-control input'
			);

			if ( hexInput === null ) {
				throw new Error(
					'The color format selector could not be found'
				);
			}

			expect( hexInput ).toBeInTheDocument();

			await user.clear( hexInput );
			await user.type( hexInput, '1ab' );

			expect( onChange ).toHaveBeenCalledTimes( 3 );
			expect( onChange ).toHaveBeenLastCalledWith( '#11aabb' );
		} );
	} );

	describe.each( [
		[ 'red', 0, '#7dffff' ],
		[ 'green', 1, '#ff7dff' ],
		[ 'blue', 2, '#ffff7d' ],
	] )( 'RGB inputs', ( colorInput, inputIndex, expected ) => {
		it( `should fire onChange with the correct value when the ${ colorInput } value is updated`, async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const color = '#fff';

			const { container } = render(
				<ColorPicker
					onChange={ onChange }
					color={ color }
					enableAlpha={ false }
				/>
			);

			const formatSelector = getFormatSelector( container );

			if ( formatSelector === null ) {
				throw new Error(
					'The color format selector could not be found'
				);
			}

			expect( formatSelector ).toBeInTheDocument();

			await user.selectOptions( formatSelector, 'rgb' );

			const inputElement =
				screen.getAllByRole( 'spinbutton' )[ inputIndex ];

			if ( inputElement === null ) {
				throw new Error(
					`The ${ colorInput } input could not be found`
				);
			}

			expect( inputElement ).toBeInTheDocument();

			await user.clear( inputElement );
			await user.type( inputElement, '125' );

			expect( onChange ).toHaveBeenCalledTimes( 4 );
			expect( onChange ).toHaveBeenLastCalledWith( expected );
		} );
	} );

	describe.each( [
		[ 'hue', 0, '#aad52a' ],
		[ 'saturation', 1, '#20dfdf' ],
		[ 'lightness', 2, '#95eaea' ],
	] )( 'HSL inputs', ( colorInput, inputIndex, expected ) => {
		it( `should fire onChange with the correct value when the ${ colorInput } value is updated`, async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const color = '#2ad5d5';

			const { container } = render(
				<ColorPicker
					onChange={ onChange }
					color={ color }
					enableAlpha={ false }
				/>
			);

			const formatSelector = getFormatSelector( container );

			if ( formatSelector === null ) {
				throw new Error(
					'The color format selector could not be found'
				);
			}

			expect( formatSelector ).toBeInTheDocument();

			await user.selectOptions( formatSelector, 'hsl' );

			const inputElement =
				screen.getAllByRole( 'spinbutton' )[ inputIndex ];

			if ( inputElement === null ) {
				throw new Error(
					`The ${ colorInput } input could not be found`
				);
			}

			expect( inputElement ).toBeInTheDocument();

			await user.clear( inputElement );
			await user.type( inputElement, '75' );

			expect( onChange ).toHaveBeenCalledTimes( 3 );
			expect( onChange ).toHaveBeenLastCalledWith( expected );
		} );
	} );
} );
