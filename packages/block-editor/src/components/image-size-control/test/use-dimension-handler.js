/**
 * External dependencies
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useDimensionHandler from '../use-dimension-handler';

describe( 'useDimensionHandler hook', () => {
	const mockOnChange = jest.fn();
	const getHeightInput = () => screen.getByTestId( 'heightInput' );
	const getWidthInput = () => screen.getByTestId( 'widthInput' );

	function TestComponent( {
		height,
		width,
		imageHeight,
		imageWidth,
		onChange,
	} ) {
		const {
			currentHeight,
			currentWidth,
			updateDimension,
			updateDimensions,
		} = useDimensionHandler(
			height,
			width,
			imageHeight,
			imageWidth,
			onChange
		);

		return (
			<>
				<input
					data-testid="heightInput"
					type="text"
					value={ currentHeight }
					onChange={ ( event ) =>
						updateDimension( 'height', event.target.value )
					}
				/>
				<input
					data-testid="widthInput"
					type="text"
					value={ currentWidth }
					onChange={ ( event ) =>
						updateDimension( 'width', event.target.value )
					}
				/>

				{ /* Contrived example with hard-coded value serves to demonstrate updates. */ }
				<input
					type="button"
					value="Update"
					onClick={ () => updateDimensions( 200, 300 ) }
				/>
				<input
					value="Reset"
					type="button"
					onClick={ () => updateDimensions() }
				/>
			</>
		);
	}

	afterEach( () => {
		// cleanup on exiting
		jest.clearAllMocks();
	} );

	it( 'returns custom dimensions when they exist', () => {
		render(
			<TestComponent
				height="100"
				width="200"
				imageHeight="300"
				imageWidth="400"
				onChange={ mockOnChange }
			/>
		);

		expect( getHeightInput().value ).toBe( '100' );
		expect( getWidthInput().value ).toBe( '200' );
	} );

	it( 'returns default dimensions when custom dimensions are undefined', () => {
		render(
			<TestComponent
				imageHeight="300"
				imageWidth="400"
				onChange={ mockOnChange }
			/>
		);

		expect( getHeightInput().value ).toBe( '300' );
		expect( getWidthInput().value ).toBe( '400' );
	} );

	it( 'returns empty string when custom and default dimensions are undefined', () => {
		render( <TestComponent onChange={ mockOnChange } /> );

		expect( getHeightInput().value ).toBe( '' );
		expect( getWidthInput().value ).toBe( '' );
	} );

	it( 'returns default dimensions when initially undefined defaults are defined on rerender', () => {
		// Simulates an initial render with custom and default dimensions undefined.
		// This occurs when an image is uploaded for the first time, for example.
		const { rerender } = render(
			<TestComponent onChange={ mockOnChange } />
		);

		const heightInput = getHeightInput();
		const widthInput = getWidthInput();

		// The dimensions are initially set to an empty string.
		expect( heightInput.value ).toBe( '' );
		expect( widthInput.value ).toBe( '' );

		// When new default dimensions are passed on a rerender (for example after they
		// are calculated following an image upload), update values to the new defaults.
		rerender(
			<TestComponent
				imageHeight="300"
				imageWidth="400"
				onChange={ mockOnChange }
			/>
		);

		// The dimensions should update to the defaults.
		expect( heightInput.value ).toBe( '300' );
		expect( widthInput.value ).toBe( '400' );
	} );

	describe( 'updateDimension', () => {
		it( 'updates height and calls onChange', async () => {
			render( <TestComponent onChange={ mockOnChange } /> );

			const heightInput = screen.getByTestId( 'heightInput' );
			const widthInput = screen.getByTestId( 'widthInput' );

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
			render( <TestComponent onChange={ mockOnChange } /> );

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
				<TestComponent
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
				// onChange is called and sets the dimension to undefined rather than
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
				<TestComponent
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
				// onChange is called and sets the dimension to undefined rather than
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

	describe( 'updateDimensions', () => {
		it( 'updates both height and width', async () => {
			render(
				<TestComponent
					imageHeight="100"
					imageWidth="100"
					onChange={ mockOnChange }
				/>
			);

			const heightInput = getHeightInput();
			const widthInput = getWidthInput();

			// The initial dimension values display first.
			expect( heightInput.value ).toBe( '100' );
			expect( widthInput.value ).toBe( '100' );

			fireEvent.click( screen.getByText( 'Update' ) );

			await waitFor( () => {
				// onChange is called with values for both dimensions.
				expect( mockOnChange ).toHaveBeenCalledWith( {
					height: 200,
					width: 300,
				} );

				// The new dimension values have been set.
				expect( heightInput.value ).toBe( '200' );
				expect( widthInput.value ).toBe( '300' );
			} );
		} );
		it( 'resets dimensions to defaults when values not provided', async () => {
			render(
				<TestComponent
					imageHeight="100"
					imageWidth="100"
					height="200"
					width="200"
					onChange={ mockOnChange }
				/>
			);

			const heightInput = getHeightInput();
			const widthInput = getWidthInput();

			// The initial dimension values display first.
			expect( heightInput.value ).toBe( '200' );
			expect( widthInput.value ).toBe( '200' );

			fireEvent.click( screen.getByText( 'Reset' ) );

			await waitFor( () => {
				// The attributes are set to undefined when values were not provided.
				expect( mockOnChange ).toHaveBeenCalledWith( {
					height: undefined,
					width: undefined,
				} );

				// The display values are reset to defaults even though the attributes are undefined.
				expect( heightInput.value ).toBe( '100' );
				expect( widthInput.value ).toBe( '100' );
			} );
		} );
	} );
} );
