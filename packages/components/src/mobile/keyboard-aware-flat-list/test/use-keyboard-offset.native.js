/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import RCTDeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';

/**
 * Internal dependencies
 */
import useKeyboardOffset from '../use-keyboard-offset';

describe( 'useKeyboardOffset', () => {
	beforeEach( () => {
		Keyboard.removeAllListeners( 'keyboardDidShow' );
		Keyboard.removeAllListeners( 'keyboardDidHide' );
	} );

	it( 'returns the initial state', () => {
		// Arrange
		const { result } = renderHook( () => useKeyboardOffset( true ) );
		const [ keyboardOffset ] = result.current;

		// Assert
		expect( keyboardOffset ).toBe( 0 );
	} );

	it( 'updates keyboard visibility and offset when the keyboard is shown', () => {
		// Arrange
		const { result } = renderHook( () => useKeyboardOffset( true ) );

		// Act
		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidShow', {
				endCoordinates: { height: 250 },
			} );
		} );

		// Assert
		const [ keyboardOffset ] = result.current;
		expect( keyboardOffset ).toBe( 250 );
	} );

	it( 'updates keyboard visibility and offset when the keyboard is hidden', () => {
		// Arrange
		const { result } = renderHook( () => useKeyboardOffset( true ) );

		// Act
		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidShow', {
				endCoordinates: { height: 250 },
			} );
		} );

		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidHide' );
		} );

		// Assert
		const [ keyboardOffset ] = result.current;
		expect( keyboardOffset ).toBe( 0 );
	} );

	it( 'removes all keyboard listeners when scrollEnabled changes to false', () => {
		// Arrange
		const { result, rerender } = renderHook(
			( { scrollEnabled } ) => useKeyboardOffset( scrollEnabled ),
			{
				initialProps: { scrollEnabled: true },
			}
		);
		const [ keyboardOffset ] = result.current;

		// Act
		rerender( { scrollEnabled: false } );

		// Assert
		expect( keyboardOffset ).toBe( 0 );
		expect( RCTDeviceEventEmitter.listenerCount( 'keyboardDidHide' ) ).toBe(
			0
		);
		expect( RCTDeviceEventEmitter.listenerCount( 'keyboardDidShow' ) ).toBe(
			0
		);
	} );

	it( 'adds all keyboard listeners when scrollEnabled changes to true', () => {
		// Arrange
		const { result, rerender } = renderHook(
			( { scrollEnabled } ) => useKeyboardOffset( scrollEnabled ),
			{
				initialProps: { scrollEnabled: false },
			}
		);
		// Act
		act( () => {
			rerender( { scrollEnabled: true } );
		} );

		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidShow', {
				endCoordinates: { height: 250 },
			} );
		} );

		const [ keyboardOffset ] = result.current;

		// Assert
		expect( keyboardOffset ).toBe( 250 );
		expect( RCTDeviceEventEmitter.listenerCount( 'keyboardDidShow' ) ).toBe(
			1
		);
		expect( RCTDeviceEventEmitter.listenerCount( 'keyboardDidHide' ) ).toBe(
			1
		);
	} );
} );
