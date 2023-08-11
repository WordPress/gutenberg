/**
 * External dependencies
 */
import { render, fireEvent } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { ColorPicker } from '@wordpress/components';

describe( 'color picker', () => {
	it( 'selects the correct color', async () => {
		const shouldEnableBottomSheetMaxHeight = jest.fn();
		const onHandleClosingBottomSheet = jest.fn();

		const { getByTestId } = render(
			<ColorPicker
				shouldEnableBottomSheetMaxHeight={
					shouldEnableBottomSheetMaxHeight
				}
				onHandleClosingBottomSheet={ onHandleClosingBottomSheet }
				testID="color-picker"
			/>
		);

		const colorPicker = getByTestId( 'color-picker' );

		// Assert label text before tapping color picker
		expect( colorPicker.getByText( 'Select a color' ) ).toBeVisible();

		// Tap color picker
		fireEvent( colorPicker, 'onHuePickerPress', {
			hue: 120,
			saturation: 12,
			value: 50,
		} );

		// Assert label hex value after tapping color picker
		expect( colorPicker.getByText( '#00FF00' ) ).toBeVisible();
	} );
} );
