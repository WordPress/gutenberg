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

jest.useFakeTimers();

describe( 'useKeyboardOffset', () => {
	beforeEach( () => {
		Keyboard.removeAllListeners( 'keyboardDidShow' );
		Keyboard.removeAllListeners( 'keyboardDidHide' );
		Keyboard.removeAllListeners( 'keyboardWillShow' );
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
		const shouldPreventAutomaticScroll = jest.fn().mockReturnValue( false );
		const { result } = renderHook( () =>
			useKeyboardOffset( true, shouldPreventAutomaticScroll )
		);

		// Act
		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidShow', {
				endCoordinates: { height: 250 },
			} );
		} );

		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidHide' );
			jest.runAllTimers();
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

	it( 'does not set keyboard offset to 0 when keyboard is hidden and shouldPreventAutomaticScroll is true', () => {
		// Arrange
		const shouldPreventAutomaticScroll = jest.fn().mockReturnValue( true );
		const { result } = renderHook( () =>
			useKeyboardOffset( true, shouldPreventAutomaticScroll )
		);

		// Act
		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidShow', {
				endCoordinates: { height: 250 },
			} );
		} );
		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidHide' );
			jest.runAllTimers();
		} );

		// Assert
		expect( result.current[ 0 ] ).toBe( 250 );
	} );

	it( 'handles updates to shouldPreventAutomaticScroll', () => {
		// Arrange
		const preventScrollTrue = jest.fn( () => true );
		const preventScrollFalse = jest.fn( () => false );

		// Act
		const { result, rerender } = renderHook(
			( { shouldPreventAutomaticScroll } ) =>
				useKeyboardOffset( true, shouldPreventAutomaticScroll ),
			{
				initialProps: {
					shouldPreventAutomaticScroll: preventScrollFalse,
				},
			}
		);

		// Assert
		expect( result.current[ 0 ] ).toBe( 0 );

		// Act
		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidShow', {
				endCoordinates: { height: 150 },
			} );
		} );

		// Assert
		expect( result.current[ 0 ] ).toBe( 150 );

		// Act
		act( () => {
			rerender( { shouldPreventAutomaticScroll: preventScrollTrue } );
		} );

		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidHide' );
			jest.runAllTimers();
		} );

		// Assert
		expect( result.current[ 0 ] ).toBe( 150 );

		// Act
		act( () => {
			rerender( { shouldPreventAutomaticScroll: preventScrollFalse } );
		} );

		act( () => {
			RCTDeviceEventEmitter.emit( 'keyboardDidShow', {
				endCoordinates: { height: 250 },
			} );
		} );

		// Assert
		expect( result.current[ 0 ] ).toBe( 250 );
	} );
} );
