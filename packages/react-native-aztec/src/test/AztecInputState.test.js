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
	notifyInputChange,
	removeFocusChangeListener,
} from '../AztecInputState';

jest.mock(
	'react-native/Libraries/Components/TextInput/TextInputState',
	() => ( {
		focusTextInput: jest.fn(),
		blurTextInput: jest.fn(),
		currentlyFocusedInput: jest.fn(),
	} )
);

const ref = { current: null };

const updateCurrentFocusedInput = ( value ) => {
	TextInputState.currentlyFocusedInput.mockReturnValue( value );
	notifyInputChange();
};

describe( 'Aztec Input State', () => {
	it( 'listens to focus change event', () => {
		const listener = jest.fn();
		const anotherRef = { current: null };
		addFocusChangeListener( listener );

		updateCurrentFocusedInput( ref );

		expect( listener ).toHaveBeenCalledWith( { isFocused: true } );

		updateCurrentFocusedInput( anotherRef );

		expect( listener ).toHaveBeenCalledTimes( 1 );

		updateCurrentFocusedInput( null );

		expect( listener ).toHaveBeenCalledWith( { isFocused: false } );
	} );

	it( 'does not call focus change listener if removed', () => {
		const listener = jest.fn();
		addFocusChangeListener( listener );
		removeFocusChangeListener( listener );

		updateCurrentFocusedInput( ref );

		expect( listener ).not.toHaveBeenCalledWith( { isFocused: true } );

		updateCurrentFocusedInput( null );

		expect( listener ).not.toHaveBeenCalledWith( { isFocused: false } );
	} );

	it( 'returns true if an element is focused', () => {
		updateCurrentFocusedInput( ref );
		expect( isFocused() ).toBeTruthy();
	} );

	it( 'returns false if an element is unfocused', () => {
		updateCurrentFocusedInput( null );
		expect( isFocused() ).toBeFalsy();
	} );

	it( 'returns current focused element', () => {
		const anotherRef = { current: null };
		updateCurrentFocusedInput( ref );
		expect( getCurrentFocusedElement() ).toBe( ref );

		updateCurrentFocusedInput( anotherRef );
		expect( getCurrentFocusedElement() ).toBe( anotherRef );
	} );

	it( 'returns null if focused element is unfocused', () => {
		updateCurrentFocusedInput( null );
		expect( getCurrentFocusedElement() ).toBe( null );
	} );

	it( 'focus an element', () => {
		focus( ref );
		expect( TextInputState.focusTextInput ).toHaveBeenCalledWith( ref );
	} );

	it( 'unfocuses an element', () => {
		blur( ref );
		expect( TextInputState.blurTextInput ).toHaveBeenCalledWith( ref );
	} );
} );
