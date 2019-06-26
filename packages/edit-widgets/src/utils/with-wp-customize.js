/**
 * External dependencies
 */
import { throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';

/**
 * To be called on the Customizer page. Renders the
 * passed in `blocks` in the sidebar with the
 * passed in `id` on the Customizer live preview.
 *
 * @param {string}   id     The sidebar's ID.
 * @param {Object[]} blocks The blocks to render.
 */
const previewBlocksInWidgetArea = throttle( ( id, blocks ) => {
	const customizePreviewIframe = document.querySelector(
		'#customize-preview > iframe'
	);

	if ( ! customizePreviewIframe || ! customizePreviewIframe.contentDocument ) {
		return;
	}

	const widgetArea = customizePreviewIframe.contentDocument.querySelector(
		`[data-customize-partial-placement-context*='"sidebar_id":"${ id }"']`
	);

	if ( widgetArea ) {
		widgetArea.innerHTML = serialize( blocks );
	}
}, 1000 );

/**
 * Calls the passed in function with the Customizer API
 * object, the function for rendering blocks live previews,
 * and a reference to the Customizer's save button.
 * It will only call the function if the current page is
 * the Customizer and all the necessary globals are available.
 *
 * @param {Function} func The function to call.
 *
 * @return {*} The return value of `func`.
 */
export default function withWPCustomize( func ) {
	const saveButton = document.querySelector(
		'#customize-save-button-wrapper > #save'
	);

	if ( window.wp && window.wp.customize && saveButton ) {
		return func( {
			customize: window.wp.customize,
			previewBlocksInWidgetArea,
			saveButton,
		} );
	}
}
