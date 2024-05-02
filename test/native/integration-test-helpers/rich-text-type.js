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
 * @param {HTMLElement} richText                        RichText test instance.
 * @param {string}      text                            Text to set.
 * @param {Object}      options                         Configuration options for selection.
 * @param {number}      [options.initialSelectionStart] Selection start position before the text is inserted.
 * @param {number}      [options.initialSelectionEnd]   Selection end position before the text is inserted.
 * @param {number}      [options.finalSelectionStart]   Selection start position after the text is inserted.
 * @param {number}      [options.finalSelectionEnd]     Selection end position after the text is inserted.
 */
export const typeInRichText = ( richText, text, options = {} ) => {
	const currentValueSansOuterHtmlTags = stripOuterHtmlTags(
		richText.props.value
	);
	const {
		initialSelectionStart = currentValueSansOuterHtmlTags.length,
		initialSelectionEnd = initialSelectionStart,
		finalSelectionStart = currentValueSansOuterHtmlTags.length +
			text.length,
		finalSelectionEnd = finalSelectionStart,
	} = options;

	fireEvent( richText, 'focus' );
	// `onSelectionChange` invokes `onChange`; we only need to trigger the former.
	fireEvent(
		richText,
		'onSelectionChange',
		finalSelectionStart,
		finalSelectionEnd,
		text,
		{
			nativeEvent: {
				eventCount: ( eventCount += 101 ), // Avoid Aztec dropping the event.
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
