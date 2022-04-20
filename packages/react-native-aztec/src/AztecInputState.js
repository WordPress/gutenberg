/**
 * External dependencies
 */
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

const focusChangeListeners = [];

let currentFocusedElement = null;

/**
 * Adds a listener that will be called in the following cases:
 *
 * - An Aztec view is being focused and all were previously unfocused.
 * - An Aztec view is being unfocused and none will be focused.
 *
 * Note that this listener won't be called when switching focus between Aztec views.
 *
 * @param {Function} listener
 */
export const addFocusChangeListener = ( listener ) => {
	focusChangeListeners.push( listener );
};

/**
 * Removes a listener from the focus change listeners list.
 *
 * @param {Function} listener
 */
export const removeFocusChangeListener = ( listener ) => {
	const itemIndex = focusChangeListeners.indexOf( listener );
	if ( itemIndex !== -1 ) {
		focusChangeListeners.splice( itemIndex, 1 );
	}
};

const notifyListeners = ( { isFocused } ) => {
	focusChangeListeners.forEach( ( listener ) => {
		listener( { isFocused } );
	} );
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
 * Notifies that an Aztec view is being focused or unfocused.
 */
export const notifyInputChange = () => {
	const focusedInput = TextInputState.currentlyFocusedInput();
	const hasAnyFocusedInput = focusedInput !== null;
	if ( hasAnyFocusedInput && ! currentFocusedElement ) {
		notifyListeners( { isFocused: true } );
		currentFocusedElement = focusedInput;
	} else if ( ! hasAnyFocusedInput && currentFocusedElement ) {
		currentFocusedElement = null;
		notifyListeners( { isFocused: false } );
	}
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
