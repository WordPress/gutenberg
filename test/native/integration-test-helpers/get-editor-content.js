/**
 * WordPress dependencies
 */
import {
	subscribeParentGetHtml,
	provideToNative_Html as provideToNativeHtml,
} from '@wordpress/react-native-bridge';

// Set up the mocks for getting the HTML output of the editor
let triggerHtmlSerialization;
let serializedContent = {};
subscribeParentGetHtml.mockImplementation( ( callback ) => {
	if ( ! triggerHtmlSerialization ) {
		triggerHtmlSerialization = callback;
		return {
			remove: () => {
				triggerHtmlSerialization = undefined;
			},
		};
	}
} );
provideToNativeHtml.mockImplementation(
	( html, title, hasChanges, contentInfo ) => {
		serializedContent = { html, title, hasChanges, contentInfo };
	}
);

/**
 * Gets the current HTML output of the editor.
 *
 * @return {string} HTML output
 */
export function getEditorHtml() {
	if ( ! triggerHtmlSerialization ) {
		throw new Error( 'HTML serialization trigger is not defined.' );
	}
	triggerHtmlSerialization();
	return serializedContent.html;
}

/**
 * Gets the current title of the editor.
 *
 * @return {string} Title
 */
export function getEditorTitle() {
	if ( ! triggerHtmlSerialization ) {
		throw new Error( 'HTML serialization trigger is not defined.' );
	}
	triggerHtmlSerialization();
	return serializedContent.title;
}
