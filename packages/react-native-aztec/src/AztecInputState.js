/**
 * External dependencies
 */
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

const focusListeners = [];
const blurListeners = [];

let currentFocusedElement = null;

export const addFocusListener = ( listener ) => {
	focusListeners.push( listener );
};

export const addBlurListener = ( listener ) => {
	blurListeners.push( listener );
};

export const removeFocusListener = ( listener ) => {
	const itemIndex = focusListeners.indexOf( listener );
	if ( itemIndex !== -1 ) {
		focusListeners.splice( itemIndex, 1 );
	}
};

export const removeBlurListener = ( listener ) => {
	const itemIndex = blurListeners.indexOf( listener );
	if ( itemIndex !== -1 ) {
		blurListeners.splice( itemIndex, 1 );
	}
};

export const isFocused = () => {
	return currentFocusedElement !== null;
};

export const getCurrentFocusedElement = () => {
	return currentFocusedElement;
};

export const notifyFocus = ( element ) => {
	currentFocusedElement = element;

	focusListeners.forEach( ( listener ) => {
		listener( element );
	} );
};

export const notifyBlur = ( element ) => {
	currentFocusedElement = null;

	blurListeners.forEach( ( listener ) => {
		listener( element );
	} );
};

export const focus = ( element ) => {
	TextInputState.focusTextInput( element );
};

export const blur = ( element ) => {
	TextInputState.blurTextInput( element );
};

export const blurCurrentFocusedElement = () => {
	if ( isFocused() ) {
		blur( getCurrentFocusedElement() );
	}
};
