/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

/**
 * Paste content into a RichText component.
 *
 * @param {import('react-test-renderer').ReactTestInstance} richText       RichText test instance.
 * @param {Object}                                          content        Content to paste.
 * @param {string}                                          content.text   Text format of the content.
 * @param {string}                                          [content.html] HTML format of the content. If not provided, text format will be used.
 */
export const pasteIntoRichText = ( richText, { text, html } ) => {
	fireEvent( richText, 'focus' );
	fireEvent( richText, 'paste', {
		preventDefault: jest.fn(),
		nativeEvent: {
			eventCount: 1,
			target: undefined,
			files: [],
			pastedHtml: html || text,
			pastedText: text,
		},
	} );
};
