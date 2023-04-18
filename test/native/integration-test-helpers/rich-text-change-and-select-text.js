/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';

let eventCount = 0;

function stripOuterHtmlTags( string ) {
	return string.replace( /^<[^>]*>|<[^>]*>$/g, '' );
}

function insertTextAtPosition( text, newText, start, end ) {
	return text.slice( 0, start ) + newText + text.slice( end );
}

/**
 * Changes the text and selection of a RichText component.
 *
 * @param {import('react-test-renderer').ReactTestInstance} richText                        RichText test instance.
 * @param {string}                                          text                            Text to be set.
 * @param {Object}                                          options                         Configuration options for selection.
 * @param {number}                                          [options.initialSelectionStart]
 * @param {number}                                          [options.initialSelectionEnd]
 * @param {number}                                          [options.selectionStart]        Selection start position.
 * @param {number}                                          [options.selectionEnd]          Selection end position.
 */
export const changeAndSelectTextOfRichText = (
	richText,
	text,
	options = {}
) => {
	const currentValueSansOuterHtmlTags = stripOuterHtmlTags(
		richText.props.value
	);
	const {
		initialSelectionStart = currentValueSansOuterHtmlTags.length,
		initialSelectionEnd = initialSelectionStart,
		selectionStart = 0,
		selectionEnd = selectionStart,
	} = options;

	fireEvent( richText, 'focus' );
	fireEvent(
		richText,
		'onSelectionChange',
		selectionStart,
		selectionEnd,
		text,
		{
			nativeEvent: {
				eventCount: ( eventCount += 101 ),
				target: undefined,
				text: insertTextAtPosition(
					currentValueSansOuterHtmlTags,
					text,
					initialSelectionStart,
					initialSelectionEnd
				),
			},
		}
	);
};
