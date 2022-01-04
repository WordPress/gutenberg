/**
 * External dependencies
 */
import { fireEvent, render } from 'test/helpers';

/**
 * Internal dependencies
 */
import BottomSheetCell from '../cell.native.js';

describe( '<BottomSheetCell />', () => {
	it( 'renders the component', async () => {
		const screen = render( <BottomSheetCell /> );
		const cellTouchable = screen.getByTestId( 'cell-touchable' );

		expect( cellTouchable ).toBeTruthy();
	} );

	it( 'displays a clear button when the text has value', async () => {
		const onChangeValueMock = jest.fn();
		const testValueString = 'test value string';
		const newTestValueString = 'new test value string';

		const screen = render(
			<BottomSheetCell
				displayClearButton={ true }
				value={ testValueString }
				onChangeValue={ onChangeValueMock }
			/>
		);

		// Invoke editing behavior by pressing the Cell
		const cellTouchable = await screen.getByTestId( 'cell-touchable' );
		fireEvent.press( cellTouchable );

		// Simulate onChangeValue events (without rerender)
		const textInput = await screen.getByTestId( 'text-input' );
		fireEvent( textInput, 'focus' );
		fireEvent.changeText( textInput, newTestValueString );
		expect( onChangeValueMock ).toHaveBeenCalledWith( newTestValueString );

		const clearButton = await screen.getByTestId( 'clear-button' );
		expect( clearButton ).toBeTruthy();
	} );

	it( 'does NOT display a clear button when the text is empty', async () => {
		const onChangeValueMock = jest.fn();

		const screen = render(
			<BottomSheetCell
				displayClearButton={ true }
				value={ '' }
				onChangeValue={ onChangeValueMock }
			/>
		);

		// Invoke editing behavior by pressing the Cell
		const cellTouchable = await screen.getByTestId( 'cell-touchable' );
		fireEvent.press( cellTouchable );

		const clearButton = await screen.queryByTestId( 'clear-button' );
		expect( clearButton ).toBeNull();
	} );

	it( 'does NOT display a clear button when displayClearButton is false', async () => {
		const onChangeValueMock = jest.fn();

		const screen = render(
			<BottomSheetCell
				displayClearButton={ false }
				value={ '' }
				onChangeValue={ onChangeValueMock }
			/>
		);

		const clearButton = await screen.queryByTestId( 'clear-button' );
		expect( clearButton ).toBeNull();
	});

	it( 'clears text input value when the clear button is pressed', async () => {
		const clearMock = jest.fn();
		const testValueString = 'test value string';

		const screen = render(
			<BottomSheetCell
				displayClearButton={ true }
				value={ testValueString }
				onClear={ clearMock }
				onChangeValue={ () => {} }
			/>
		);

		// Invoke editing behavior by pressing the Cell
		const cellTouchable = await screen.getByTestId( 'cell-touchable' );
		fireEvent.press( cellTouchable );

		// Press clear button to invoke clear handler function
		const clearButton = await screen.getByTestId( 'clear-button' );
		fireEvent.press( clearButton );
		expect( clearMock ).toHaveBeenCalled();
	} );
} );
