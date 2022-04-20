/**
 * External dependencies
 */
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

const focusListeners = [];
const blurListeners = [];

let currentFocusedElement = null;

/**
 * Adds a listener that will be called when any Aztec view is focused.
 *
 * @param {Function} listener
 */
export const addFocusListener = ( listener ) => {
	focusListeners.push( listener );
};

/**
 * Adds a listener that will be called when any Aztec view is unfocused.
 *
 * @param {Function} listener
 */
export const addBlurListener = ( listener ) => {
	blurListeners.push( listener );
};

/**
 * Removes a listener from the focus listeners list.
 *
 * @param {Function} listener
 */
export const removeFocusListener = ( listener ) => {
	const itemIndex = focusListeners.indexOf( listener );
	if ( itemIndex !== -1 ) {
		focusListeners.splice( itemIndex, 1 );
	}
};

/**
 * Removes a listener from the blur listeners list.
 *
 * @param {Function} listener
 */
export const removeBlurListener = ( listener ) => {
	const itemIndex = blurListeners.indexOf( listener );
	if ( itemIndex !== -1 ) {
		blurListeners.splice( itemIndex, 1 );
	}
};

/**
 * Determines if any Aztec view is focused.
 *
 * @return {boolean} True if focused.
 */
export const isFocused = () => {
	return currentFocusedElement !== null;
};

/**
 * Returns the current focused element.
 *
 * @return {RefObject} Ref of the current focused element or `null` otherwise.
 */
export const getCurrentFocusedElement = () => {
	return currentFocusedElement;
};

/**
 * Notifies that an Aztec view is being focused.
 *
 * @param {RefObject} element Aztec view being focused.
 */
export const notifyFocus = ( element ) => {
	currentFocusedElement = element;

	focusListeners.forEach( ( listener ) => {
		listener( element );
	} );
};

/**
 * Notifies that an Aztec view is being unfocused.
 *
 * @param {RefObject} element Aztec view being unfocused.
 */
export const notifyBlur = ( element ) => {
	currentFocusedElement = null;

	blurListeners.forEach( ( listener ) => {
		listener( element );
	} );
};

/**
 * Focuses the specified element.
 *
 * @param {RefObject} element Element to be focused.
 */
export const focus = ( element ) => {
	TextInputState.focusTextInput( element );
};

/**
 * Unfocuses the specified element.
 *
 * @param {RefObject} element Element to be unfocused.
 */
export const blur = ( element ) => {
	TextInputState.blurTextInput( element );
};

/**
 * Unfocuses the current focused element.
 */
export const blurCurrentFocusedElement = () => {
	if ( isFocused() ) {
		blur( getCurrentFocusedElement() );
	}
};
