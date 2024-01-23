/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import ImageSizeControl from '../index';

describe( 'ImageSizeControl', () => {
	const mockOnChange = jest.fn();
	const mockOnChangeImage = jest.fn();

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

		expect(
			screen.getByRole( 'spinbutton', { name: 'Height' } )
		).toHaveValue( 300 );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Width' } )
		).toHaveValue( 400 );
	} );

	it( 'returns default dimensions when custom dimensions are undefined', () => {
		render(
			<ImageSizeControl
				imageHeight="100"
				imageWidth="200"
				onChange={ mockOnChange }
			/>
		);

		expect(
			screen.getByRole( 'spinbutton', { name: 'Height' } )
		).toHaveValue( 100 );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Width' } )
		).toHaveValue( 200 );
	} );

	it( 'returns no value when custom and default dimensions are undefined', () => {
		render( <ImageSizeControl onChange={ mockOnChange } /> );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Height' } )
		).toHaveValue( null );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Width' } )
		).toHaveValue( null );
	} );

	it( 'returns default dimensions when initially undefined defaults are defined on rerender', () => {
		// Simulates an initial render with custom and default dimensions undefined.
		// This occurs when an image is uploaded for the first time, for example.
		const { rerender } = render(
			<ImageSizeControl onChange={ mockOnChange } />
		);

		const heightInput = screen.getByRole( 'spinbutton', {
			name: 'Height',
		} );
		const widthInput = screen.getByRole( 'spinbutton', { name: 'Width' } );

		// The dimensions are initially set to an empty string.
		expect( heightInput ).toHaveValue( null );
		expect( widthInput ).toHaveValue( null );

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
		expect( heightInput ).toHaveValue( 300 );
		expect( widthInput ).toHaveValue( 400 );
	} );

	describe( 'updating dimension inputs', () => {
		it( 'updates height and calls onChange', async () => {
			const user = userEvent.setup();
			render( <ImageSizeControl onChange={ mockOnChange } /> );

			const heightInput = screen.getByRole( 'spinbutton', {
				name: 'Height',
			} );
			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Width',
			} );

			expect( heightInput ).toHaveValue( null );
			expect( widthInput ).toHaveValue( null );

			const newHeight = '500';

			await user.clear( heightInput );
			await user.type( heightInput, newHeight );

			expect( mockOnChange ).toHaveBeenCalledTimes( newHeight.length );
			expect( mockOnChange ).toHaveBeenLastCalledWith( { height: 500 } );

			expect( heightInput ).toHaveValue( 500 );
			expect( widthInput ).toHaveValue( null );
		} );

		it( 'updates width and calls onChange', async () => {
			const user = userEvent.setup();

			render( <ImageSizeControl onChange={ mockOnChange } /> );

			const heightInput = screen.getByRole( 'spinbutton', {
				name: 'Height',
			} );
			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Width',
			} );

			expect( heightInput ).toHaveValue( null );
			expect( widthInput ).toHaveValue( null );

			const newWidth = '500';
			await user.clear( widthInput );
			await user.type( widthInput, newWidth );

			expect( mockOnChange ).toHaveBeenCalledTimes( newWidth.length );
			expect( mockOnChange ).toHaveBeenLastCalledWith( { width: 500 } );

			expect( heightInput ).toHaveValue( null );
			expect( widthInput ).toHaveValue( 500 );
		} );

		it( 'updates height and calls onChange for empty value', async () => {
			const user = userEvent.setup();

			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="100"
					onChange={ mockOnChange }
				/>
			);

			const heightInput = screen.getByRole( 'spinbutton', {
				name: 'Height',
			} );
			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Width',
			} );

			expect( heightInput ).toHaveValue( 100 );
			expect( widthInput ).toHaveValue( 100 );

			await user.clear( heightInput );

			// onChange is called and sets the dimension to undefined rather than
			// the empty string.
			expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
			expect( mockOnChange ).toHaveBeenLastCalledWith( {
				height: undefined,
			} );

			// Height is updated to empty value and does not reset to default.
			expect( heightInput ).toHaveValue( null );
			expect( widthInput ).toHaveValue( 100 );
		} );

		it( 'updates width and calls onChange for empty value', async () => {
			const user = userEvent.setup();

			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="100"
					onChange={ mockOnChange }
				/>
			);

			const heightInput = screen.getByRole( 'spinbutton', {
				name: 'Height',
			} );
			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Width',
			} );

			expect( heightInput ).toHaveValue( 100 );
			expect( widthInput ).toHaveValue( 100 );

			await user.clear( widthInput );

			// onChange is called and sets the dimension to undefined rather than
			// the empty string.
			expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
			expect( mockOnChange ).toHaveBeenLastCalledWith( {
				width: undefined,
			} );

			// Width is updated to empty value and does not reset to default.
			expect( heightInput ).toHaveValue( 100 );
			expect( widthInput ).toHaveValue( null );
		} );
	} );

	describe( 'reset button', () => {
		it( 'resets both height and width to default values', async () => {
			const user = userEvent.setup();

			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="200"
					height="300"
					width="400"
					onChange={ mockOnChange }
				/>
			);

			const heightInput = screen.getByRole( 'spinbutton', {
				name: 'Height',
			} );
			const widthInput = screen.getByRole( 'spinbutton', {
				name: 'Width',
			} );

			// The initial dimension values display first.
			expect( heightInput ).toHaveValue( 300 );
			expect( widthInput ).toHaveValue( 400 );

			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );

			// Both attributes are set to undefined to clear custom values.
			expect( mockOnChange ).toHaveBeenLastCalledWith( {
				height: undefined,
				width: undefined,
			} );

			// The inputs display the default values once more.
			expect( heightInput ).toHaveValue( 100 );
			expect( widthInput ).toHaveValue( 200 );
		} );
	} );

	describe( 'image size percentage presets', () => {
		it( 'updates height and width attributes on selection', async () => {
			const user = userEvent.setup();

			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="201"
					onChange={ mockOnChange }
				/>
			);

			const button = screen.getByRole( 'button', {
				name: '50%',
				pressed: false,
			} );

			await user.click( button );

			expect( button ).toHaveClass( 'is-pressed' );

			// Both attributes are set to the rounded scaled value.
			expect( mockOnChange ).toHaveBeenLastCalledWith( {
				height: 50,
				width: 101,
			} );
		} );

		it( 'updates height and width inputs on selection', async () => {
			const user = userEvent.setup();

			render(
				<ImageSizeControl
					imageHeight="100"
					imageWidth="201"
					onChange={ mockOnChange }
				/>
			);

			const button = screen.getByRole( 'button', {
				name: '50%',
				pressed: false,
			} );

			await user.click( button );

			// Both attributes are set to the rounded scaled value.
			expect(
				screen.getByRole( 'spinbutton', { name: 'Height' } )
			).toHaveValue( 50 );
			expect(
				screen.getByRole( 'spinbutton', { name: 'Width' } )
			).toHaveValue( 101 );
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

			expect(
				screen.getByRole( 'combobox', { name: 'Resolution' } )
			).toHaveValue( 'medium' );
		} );

		it( 'calls onChangeImage with selected slug on selection', async () => {
			const user = userEvent.setup();

			render(
				<ImageSizeControl
					imageSizeOptions={ IMAGE_SIZE_OPTIONS }
					slug="Medium"
					onChange={ mockOnChange }
					onChangeImage={ mockOnChangeImage }
				/>
			);

			await user.selectOptions(
				screen.getByRole( 'combobox', { name: 'Resolution' } ),
				'thumbnail'
			);

			// onChangeImage is called with the slug and the event.
			expect( mockOnChangeImage ).toHaveBeenLastCalledWith(
				'thumbnail',
				expect.any( Object )
			);
		} );
	} );
} );
