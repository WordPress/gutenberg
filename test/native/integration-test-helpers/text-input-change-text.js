/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

/**
 * Changes the text of a TextInput component.
 *
 * @param {import('react-test-renderer').ReactTestInstance} textInput TextInput test instance.
 * @param {string}                                          text      Text to be set.
 */
export const changeTextOfTextInput = ( textInput, text ) => {
	fireEvent( textInput, 'focus' );
	fireEvent.changeText( textInput, text );
};
