/**
 * External dependencies
 */
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

/**
 * Internal dependencies
 */
import {
	addFocusChangeListener,
	getCurrentFocusedElement,
	isFocused,
	focus,
	blur,
	blurOnUnmount,
	removeFocusChangeListener,
} from '../AztecInputState';

// Recreate internal state of TextInput
let currentInput = null;
TextInputState.focusTextInput = jest.fn( ( value ) => {
	currentInput = value;
} );
TextInputState.blurTextInput = jest.fn( ( value ) => {
	if ( currentInput === value ) {
		currentInput = null;
	}
} );
TextInputState.currentlyFocusedInput = jest.fn( () => currentInput );

const ref = { current: null };
const anotherRef = { current: null };

jest.useFakeTimers();

describe( 'Aztec Input State', () => {
	it( 'listens to focus change event', () => {
		const listener = jest.fn();
		addFocusChangeListener( listener );

		focus( ref );
		expect( listener ).toHaveBeenCalledWith( { isFocused: true } );

		listener.mockClear();
		focus( anotherRef );
		expect( listener ).not.toHaveBeenCalled();

		blur( anotherRef );
		jest.runAllTimers();
		expect( listener ).toHaveBeenCalledWith( { isFocused: false } );
	} );

	it( 'does not call focus change listener if removed', () => {
		const listener = jest.fn();
		addFocusChangeListener( listener );
		removeFocusChangeListener( listener );

		focus( ref );
		expect( listener ).not.toHaveBeenCalled();

		blur( ref );
		jest.runAllTimers();
		expect( listener ).not.toHaveBeenCalled();
	} );

	it( 'returns the focus state', () => {
		focus( ref );
		expect( isFocused() ).toBeTruthy();

		blur( ref );
		jest.runAllTimers();
		expect( isFocused() ).toBeFalsy();
	} );

	it( 'returns current focused element', () => {
		focus( ref );
		expect( getCurrentFocusedElement() ).toBe( ref );

		focus( anotherRef );
		expect( getCurrentFocusedElement() ).toBe( anotherRef );
	} );

	it( 'returns null if focused element is unfocused', () => {
		focus( ref );
		blur( ref );
		jest.runAllTimers();
		expect( getCurrentFocusedElement() ).toBe( null );
	} );

	it( 'focus an element', () => {
		focus( ref );
		expect( TextInputState.focusTextInput ).toHaveBeenCalledWith( ref );
	} );

	it( 'unfocuses an element', () => {
		blur( ref );
		jest.runAllTimers();
		expect( TextInputState.blurTextInput ).toHaveBeenCalledWith( ref );
	} );

	it( 'unfocuses an element when unmounted', () => {
		const listener = jest.fn();

		focus( ref );

		addFocusChangeListener( listener );
		blurOnUnmount( ref );
		jest.runAllTimers();

		// TextInputState will update its state internally when the text
		// input is removed. For this reason and to avoid triggering an
		// event on an removed element, we don't call blurTextInput.
		expect( TextInputState.blurTextInput ).not.toHaveBeenCalled();
		expect( listener ).toHaveBeenCalledWith( { isFocused: false } );
		expect( listener ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'cancels blur event when unfocusing an element that will be unmounted', () => {
		const listener = jest.fn();

		focus( ref );

		addFocusChangeListener( listener );
		blur( ref );
		blurOnUnmount( ref );
		jest.runAllTimers();

		// TextInputState will update its state internally when the text
		// input is removed. For this reason and to avoid triggering an
		// event on an removed element, we don't call blurTextInput.
		expect( TextInputState.blurTextInput ).not.toHaveBeenCalled();
		expect( listener ).toHaveBeenCalledWith( { isFocused: false } );
		expect( listener ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'cancels blur event when focusing an element', () => {
		focus( ref );
		blur( ref );
		focus( anotherRef );
		jest.runAllTimers();

		expect( TextInputState.focusTextInput ).toHaveBeenCalledTimes( 2 );
		expect( TextInputState.blurTextInput ).not.toHaveBeenCalled();
	} );
} );
