/**
 * External dependencies
 */
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

/**
 * Internal dependencies
 */
import {
	addBlurListener,
	addFocusListener,
	getCurrentFocusedElement,
	isFocused,
	focus,
	blur,
	notifyBlur,
	notifyFocus,
	removeFocusListener,
	removeBlurListener,
} from '../AztecInputState';

jest.mock(
	'react-native/Libraries/Components/TextInput/TextInputState',
	() => ( {
		focusTextInput: jest.fn(),
		blurTextInput: jest.fn(),
	} )
);

const ref = { current: null };

describe( 'Aztec Input State', () => {
	it( 'listens to focus event', () => {
		const listener = jest.fn();
		addFocusListener( listener );
		notifyFocus( ref );
		expect( listener ).toHaveBeenCalledWith( ref );
	} );

	it( 'listens to blur event', () => {
		const listener = jest.fn();
		addBlurListener( listener );
		notifyBlur( ref );
		expect( listener ).toHaveBeenCalledWith( ref );
	} );

	it( 'does not call focus listener if removed', () => {
		const listener = jest.fn();
		addFocusListener( listener );
		removeFocusListener( listener );
		notifyFocus( ref );
		expect( listener ).not.toHaveBeenCalled();
	} );

	it( 'does not call blur listener if removed', () => {
		const listener = jest.fn();
		addBlurListener( listener );
		removeBlurListener( listener );
		notifyBlur( ref );
		expect( listener ).not.toHaveBeenCalled();
	} );

	it( 'returns true if an element is focused', () => {
		notifyFocus( ref );
		expect( isFocused() ).toBeTruthy();
	} );

	it( 'returns false if an element is unfocused', () => {
		notifyFocus( ref );
		notifyBlur( ref );
		expect( isFocused() ).toBeFalsy();
	} );

	it( 'returns current focused element', () => {
		notifyFocus( ref );
		expect( getCurrentFocusedElement() ).toBe( ref );
	} );

	it( 'returns null if focused element is unfocused', () => {
		notifyFocus( ref );
		notifyBlur( ref );
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
