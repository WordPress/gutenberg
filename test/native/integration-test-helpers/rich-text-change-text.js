/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

/**
 * Changes the text of a RichText component.
 *
 * @param {import('react-test-renderer').ReactTestInstance} richText RichText test instance.
 * @param {string}                                          text     Text to be set.
 */
export const changeTextOfRichText = ( richText, text ) => {
	fireEvent( richText, 'focus' );
	fireEvent( richText, 'onChange', {
		nativeEvent: {
			eventCount: 1,
			target: undefined,
			text,
		},
	} );
};
