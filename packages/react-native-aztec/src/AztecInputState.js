/**
 * External dependencies
 */
import { Platform } from 'react-native';
import TextInputState from 'react-native/Libraries/Components/TextInput/TextInputState';

/**
 * WordPress dependencies
 */
import { debounce } from '@wordpress/compose';
import { hideAndroidSoftKeyboard } from '@wordpress/react-native-bridge';

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
 * Sets the current focused element ref held within TextInputState.
 *
 * @param {RefObject} element Element to be set as the focused element.
 */
export const focusInput = ( element ) => {
	TextInputState.focusInput( element );
};

/**
 * Focuses the specified element.
 *
 * @param {RefObject} element Element to be focused.
 */
export const focus = ( element ) => {
	// If other blur events happen at the same time that focus is triggered, the focus event
	// will take precedence and cancels pending blur events.
	blur.cancel();
	// Similar to blur events, we also need to cancel potential keyboard dismiss.
	blurOnUnmountDebounce.cancel();

	TextInputState.focusTextInput( element );
	notifyInputChange();
};

/**
 * Unfocuses the specified element.
 * This function uses debounce to avoid conflicts with the focus event when both are
 * triggered at the same time. Focus events will take precedence.
 *
 * @param {RefObject} element Element to be unfocused.
 */
export const blur = debounce( ( element ) => {
	TextInputState.blurTextInput( element );
	setCurrentCaretData( null );
	notifyInputChange();
}, 0 );

/**
 * Unfocuses the specified element in case it's about to be unmounted.
 *
 * Note that we can't trigger the blur event, as it's likely that the Aztec view is no
 * longer available when the event is executed and will produce an exception.
 *
 * @param {RefObject} element Element to be unfocused.
 */
export const blurOnUnmount = ( element ) => {
	if ( getCurrentFocusedElement() === element ) {
		// If a blur event was triggered before unmount, we need to cancel them to avoid
		// exceptions.
		blur.cancel();
		blurOnUnmountDebounce();
	}
};

// For updating the input state and dismissing the keyboard, we use debounce to avoid
// conflicts with the focus event when both are triggered at the same time.
const blurOnUnmountDebounce = debounce( () => {
	// At this point, the text input will be destroyed but it's still focused. Hence, we
	// have to explicitly notify listeners and update internal input state.
	notifyListeners( { isFocused: false } );
	currentFocusedElement = null;

	// On iOS text inputs are automatically unfocused and keyboard dismissed when they
	// are removed. However, this is not the case on Android, where text inputs are
	// unfocused but the keyboard remains open.
	if ( Platform.OS === 'android' ) {
		hideAndroidSoftKeyboard();
	}
}, 0 );

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
