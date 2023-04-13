/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

/**
 * Changes the text and selection of a RichText component.
 *
 * @param {import('react-test-renderer').ReactTestInstance} richText                 RichText test instance.
 * @param {string}                                          text                     Text to be set.
 * @param {Object}                                          options                  Configuration options for selection.
 * @param {number}                                          [options.selectionStart] Selection start position.
 * @param {number}                                          [options.selectionEnd]   Selection end position.
 */
export const changeAndSelectTextOfRichText = (
	richText,
	text,
	{ selectionStart = 0, selectionEnd = 0 } = {}
) => {
	fireEvent( richText, 'focus' );
	fireEvent(
		richText,
		'onSelectionChange',
		selectionStart,
		selectionEnd,
		text,
		{
			nativeEvent: {
				eventCount: 1,
				target: undefined,
				text,
			},
		}
	);
};
