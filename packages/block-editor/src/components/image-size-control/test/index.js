/**
 * External dependencies
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ImageSizeControl from '../index';

describe( 'ImageSizeControl', () => {
	const mockOnChange = jest.fn();
	const mockOnChangeImage = jest.fn();
	const getHeightInput = () => screen.getByLabelText( 'Height' );
	const getWidthInput = () => screen.getByLabelText( 'Width' );

	afterEach( () => {
		// Cleanup on exiting.
		jest.clearAllMocks();
	} );

	it( 'returns custom dimensions when they exist', () => {
		render(
			<ImageSizeControl
				imageHeight="100"
				imageWidth="200"
				height="300"
				width="400"
				slug=""
				onChange={ mockOnChange }
			/>
		);

		expect( getHeightInput().value ).toBe( '300' );
		expect( getWidthInput().value ).toBe( '400' );
	} );

	it( 'returns default dimensions when custom dimensions are undefined', () => {
		render(
			<ImageSizeControl
				imageHeight="100"
				imageWidth="200"
				onChange={ mockOnChange }
			/>
		);

		expect( getHeightInput().value ).toBe( '100' );
		expect( getWidthInput().value ).toBe( '200' );
	} );

	it( 'returns empty string when custom and default dimensions are undefined', () => {
		render( <ImageSizeControl onChange={ mockOnChange } /> );

		expect( getHeightInput().value ).toBe( '' );
		expect( getWidthInput().value ).toBe( '' );
	} );

	it( 'returns default dimensions when initially undefined defaults are defined on rerender', () => {
		// Simulates an initial render with custom and default dimensions undefined.
		// This occurs when an image is uploaded for the first time, for example.
		const { rerender } = render(
			<ImageSizeControl onChange={ mockOnChange } />
		);

		const heightInput = getHeightInput();
		const widthInput = getWidthInput();

		// The dimensions are initially set to an empty string.
		expect( heightInput.value ).toBe( '' );
		expect( widthInput.value ).toBe( '' );

		// When new default dimensions are passed on a rerender (for example after they
		// are calculated following an image upload), update values to the new defaults.
		rerender(
			<ImageSizeControl
				imageHeight="300"
				imageWidth="400"
				onChange={ mockOnChange }
			/>
		);

		// The dimensions should update to the defaults.
		expect( heightInput.value ).toBe( '300' );
		expect( widthInput.value ).toBe( '400' );
	} );

	describe( 'updating dimension inputs', () => {
		it( 'updates height and calls onChange', async () => {
			render( <ImageSizeControl onChange={ mockOnChange } /> );

			const heightInput = getHeightInput();
			const widthInput = getWidthInput();

			expect( heightInput.value ).toBe( '' );
			expect( widthInput.value ).toBe( '' );

			fireEvent.change( heightInput, { target: { value: '500' } } );

			await waitFor( () => {
				expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnChange ).toHaveBeenCalledWith( { height: 500 } );
			} );

			expect( heightInput.value ).toBe( '500' );
			expect( widthInput.value ).toBe( '' );
		} );

		it( 'updates width and calls onChange', async () => {
			render( <ImageSizeControl onChange={ mockOnChange } /> );

			const heightInput = getHeightInput();
			const widthInput = getWidthInput();

			expect( heightInput.value ).toBe( '' );
			expect( widthInput.value ).toBe( '' );

			fireEvent.change( widthInput, { target: { value: '500' } } );
			await waitFor( () => {
				expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnChange ).toHaveBeenCalledWith( { width: 500 } );
			} );

			expect( heightInput.value ).toBe( '' );
			expect( widthInput.value ).toBe( '500' );
		} );

		it( 'updates height and calls onChange for empty value', async () => {
			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="100"
					onChange={ mockOnChange }
				/>
			);

			const heightInput = getHeightInput();
			const widthInput = getWidthInput();

			expect( heightInput.value ).toBe( '100' );
			expect( widthInput.value ).toBe( '100' );

			fireEvent.change( heightInput, { target: { value: '' } } );

			await waitFor( () => {
				// OnChange is called and sets the dimension to undefined rather than
				// the empty string.
				expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnChange ).toHaveBeenCalledWith( {
					height: undefined,
				} );
			} );
			// Height is updated to empty value and does not reset to default.
			expect( heightInput.value ).toBe( '' );
			expect( widthInput.value ).toBe( '100' );
		} );

		it( 'updates width and calls onChange for empty value', async () => {
			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="100"
					onChange={ mockOnChange }
				/>
			);

			const heightInput = getHeightInput();
			const widthInput = getWidthInput();

			expect( heightInput.value ).toBe( '100' );
			expect( widthInput.value ).toBe( '100' );

			fireEvent.change( widthInput, { target: { value: '' } } );

			await waitFor( () => {
				// OnChange is called and sets the dimension to undefined rather than
				// the empty string.
				expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnChange ).toHaveBeenCalledWith( {
					width: undefined,
				} );
			} );
			// Width is updated to empty value and does not reset to default.
			expect( heightInput.value ).toBe( '100' );
			expect( widthInput.value ).toBe( '' );
		} );
	} );

	describe( 'reset button', () => {
		it( 'resets both height and width to default values', async () => {
			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="200"
					height="300"
					width="400"
					onChange={ mockOnChange }
				/>
			);

			const heightInput = getHeightInput();
			const widthInput = getWidthInput();

			// The initial dimension values display first.
			expect( heightInput.value ).toBe( '300' );
			expect( widthInput.value ).toBe( '400' );

			fireEvent.click( screen.getByText( 'Reset' ) );

			await waitFor( () => {
				// Both attributes are set to undefined to clear custom values.
				expect( mockOnChange ).toHaveBeenCalledWith( {
					height: undefined,
					width: undefined,
				} );

				// The inputs display the default values once more.
				expect( heightInput.value ).toBe( '100' );
				expect( widthInput.value ).toBe( '200' );
			} );
		} );
	} );

	describe( 'image size percentage presets', () => {
		it( 'updates height and width attributes on selection', async () => {
			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="201"
					onChange={ mockOnChange }
				/>
			);

			fireEvent.click( screen.getByText( '50%' ) );

			await waitFor( () => {
				expect( screen.getByText( '50%' ) ).toHaveClass( 'is-pressed' );

				// Both attributes are set to the rounded scaled value.
				expect( mockOnChange ).toHaveBeenCalledWith( {
					height: 50,
					width: 101,
				} );
			} );
		} );

		it( 'updates height and width inputs on selection', async () => {
			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="201"
					onChange={ mockOnChange }
				/>
			);

			fireEvent.click( screen.getByText( '50%' ) );

			await waitFor( () => {
				// Both attributes are set to the rounded scaled value.
				expect( getHeightInput().value ).toBe( '50' );
				expect( getWidthInput().value ).toBe( '101' );
			} );
		} );
	} );

	describe( 'image size slug presets', () => {
		const IMAGE_SIZE_OPTIONS = [
			{ value: 'thumbnail', label: 'Thumbnail' },
			{ value: 'medium', label: 'Medium' },
			{ value: 'large', label: 'Large' },
		];

		it( 'displays the selected slug', () => {
			render(
				<ImageSizeControl
					imageSizeOptions={ IMAGE_SIZE_OPTIONS }
					slug="medium"
					onChange={ mockOnChange }
					onChangeImage={ mockOnChangeImage }
				/>
			);

			expect( screen.getByLabelText( 'Image size' ).value ).toBe(
				'medium'
			);
		} );

		it( 'calls onChangeImage with selected slug on selection', async () => {
			render(
				<ImageSizeControl
					imageSizeOptions={ IMAGE_SIZE_OPTIONS }
					slug="Medium"
					onChange={ mockOnChange }
					onChangeImage={ mockOnChangeImage }
				/>
			);

			fireEvent.change( screen.getByLabelText( 'Image size' ), {
				target: { value: 'thumbnail' },
			} );

			await waitFor( () => {
				// OnChangeImage is called with the slug and the event.
				expect( mockOnChangeImage ).toHaveBeenCalledWith(
					'thumbnail',
					expect.any( Object )
				);
			} );
		} );
	} );
} );
