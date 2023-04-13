/**
 * External dependencies
 */
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

const focusChangeListeners = [];
const caretChangeListeners = [];

let currentFocusedElement = null;
let currentCaretData = null;

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

/**
 *	Notifies listeners about changes in focus.
 *
 * @param {Object}  event           Event data to be notified to listeners.
 * @param {boolean} event.isFocused True if any Aztec view is currently focused.
 */
const notifyListeners = ( { isFocused } ) => {
	focusChangeListeners.forEach( ( listener ) => {
		listener( { isFocused } );
	} );
};

/**
 * Adds a listener that will be called when the caret's Y position
 * changes for the focused Aztec view.
 *
 * @param {Function} listener
 */
export const addCaretChangeListener = ( listener ) => {
	caretChangeListeners.push( listener );
};

/**
 * Removes a listener from the caret change listeners list.
 *
 * @param {Function} listener
 */
export const removeCaretChangeListener = ( listener ) => {
	const itemIndex = caretChangeListeners.indexOf( listener );
	if ( itemIndex !== -1 ) {
		caretChangeListeners.splice( itemIndex, 1 );
	}
};

/**
 * Notifies listeners about caret changes in focused Aztec view.
 */
const notifyCaretChangeListeners = () => {
	caretChangeListeners.forEach( ( listener ) => {
		listener( getCurrentCaretData() );
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

	if ( hasAnyFocusedInput ) {
		if ( ! currentFocusedElement ) {
			notifyListeners( { isFocused: true } );
		}
		currentFocusedElement = focusedInput;
	} else if ( currentFocusedElement ) {
		notifyListeners( { isFocused: false } );
		currentFocusedElement = null;
	}
};

/**
 * Focuses the specified element.
 *
 * @param {RefObject} element Element to be focused.
 */
export const focus = ( element ) => {
	TextInputState.focusTextInput( element );
	notifyInputChange();
};

/**
 * Unfocuses the specified element.
 *
 * @param {RefObject} element Element to be unfocused.
 */
export const blur = ( element ) => {
	TextInputState.blurTextInput( element );
	setCurrentCaretData( null );
	notifyInputChange();
};

/**
 * Unfocuses the current focused element.
 */
export const blurCurrentFocusedElement = () => {
	if ( isFocused() ) {
		blur( getCurrentFocusedElement() );
	}
};

/**
 * Sets the current focused element caret's data.
 *
 * @param {Object} caret Caret's data.
 */
export const setCurrentCaretData = ( caret ) => {
	if ( isFocused() && caret ) {
		currentCaretData = caret;
		notifyCaretChangeListeners();
	}
};

/**
 * Get the current focused element caret's data.
 *
 * @return {Object} Current caret's data.
 */
export const getCurrentCaretData = () => {
	return currentCaretData;
};
