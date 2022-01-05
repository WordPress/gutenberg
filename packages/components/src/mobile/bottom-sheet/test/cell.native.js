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

		const clearButton = await screen.getByA11yLabel( 'Clear Button' );
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

		const clearButton = await screen.queryByA11yLabel( 'Clear Button' );
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

		const clearButton = await screen.queryByA11yLabel( 'Clear Button' );
		expect( clearButton ).toBeNull();
	} );

	it( 'calls `onClear` when the clear button is pressed', async () => {
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

		// Press clear button to invoke the `onClear` handler function
		const clearButton = await screen.getByA11yLabel( 'Clear Button' );
		fireEvent.press( clearButton );
		expect( clearMock ).toHaveBeenCalled();
	} );
} );
