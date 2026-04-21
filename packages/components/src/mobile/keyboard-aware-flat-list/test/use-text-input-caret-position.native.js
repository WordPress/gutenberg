/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react-native';

/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';

/**
 * Internal dependencies
 */
import useTextInputCaretPosition from '../use-text-input-caret-position';

describe( 'useTextInputCaretPosition', () => {
	let addCaretChangeListenerSpy;
	let removeCaretChangeListenerSpy;

	beforeAll( () => {
		addCaretChangeListenerSpy = jest.spyOn(
			RCTAztecView.InputState,
			'addCaretChangeListener'
		);
		removeCaretChangeListenerSpy = jest.spyOn(
			RCTAztecView.InputState,
			'removeCaretChangeListener'
		);
	} );

	beforeEach( () => {
		addCaretChangeListenerSpy.mockClear();
		removeCaretChangeListenerSpy.mockClear();
	} );

	it( 'should add and remove caret change listener correctly', () => {
		// Arrange
		const scrollEnabled = true;

		// Act
		const { unmount } = renderHook( () =>
			useTextInputCaretPosition( scrollEnabled )
		);
		unmount();

		// Assert
		expect( addCaretChangeListenerSpy ).toHaveBeenCalledTimes( 1 );
		expect( removeCaretChangeListenerSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should add caret change listener when scroll is enabled', () => {
		// Arrange
		const scrollEnabled = true;

		// Act
		renderHook( () => useTextInputCaretPosition( scrollEnabled ) );

		// Assert
		expect( addCaretChangeListenerSpy ).toHaveBeenCalledTimes( 1 );
		expect( removeCaretChangeListenerSpy ).not.toHaveBeenCalled();
	} );

	it( 'should remove caret change listener when scroll is enabled and then changed to disabled', () => {
		// Arrange
		const { rerender } = renderHook(
			( props ) => useTextInputCaretPosition( props.scrollEnabled ),
			{
				initialProps: { scrollEnabled: true },
			}
		);

		// Assert
		expect( addCaretChangeListenerSpy ).toHaveBeenCalled();

		// Act
		rerender( { scrollEnabled: false } );

		// Assert
		expect( removeCaretChangeListenerSpy ).toHaveBeenCalled();
		expect( addCaretChangeListenerSpy ).toHaveBeenCalledTimes( 1 );
	} );
} );
