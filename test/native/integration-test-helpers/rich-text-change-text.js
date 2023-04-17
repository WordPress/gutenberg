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
 * Changes the text of a RichText component.
 *
 * @param {import('react-test-renderer').ReactTestInstance} richText                        RichText test instance.
 * @param {string}                                          text                            Text to be set.
 * @param {Object}                                          options
 * @param {number}                                          [options.initialSelectionStart]
 * @param {number}                                          [options.initialSelectionEnd]
 */
export const changeTextOfRichText = ( richText, text, options = {} ) => {
	const currentValueSansOuterHtmlTags = stripOuterHtmlTags(
		richText.props.value
	);
	const {
		initialSelectionStart = currentValueSansOuterHtmlTags.length,
		initialSelectionEnd = initialSelectionStart,
	} = options;

	fireEvent( richText, 'focus' );
	fireEvent( richText, 'onChange', {
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
	} );
};
