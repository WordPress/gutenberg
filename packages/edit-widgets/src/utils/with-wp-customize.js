/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';

/* global wp */

function previewBlocksInWidgetArea( id, blocks ) {
	const customizePreviewIframe = document.querySelector(
		'#customize-preview > iframe'
	);

	if ( customizePreviewIframe && customizePreviewIframe.contentDocument ) {
		const widgetArea = customizePreviewIframe.contentDocument.querySelector(
			`[data-customize-partial-placement-context*='"sidebar_id":"${ id }"']`
		);

		if ( widgetArea ) {
			widgetArea.innerHTML = serialize( blocks );
		}
	}
}

export default function withWPCustomize( func ) {
	const saveButton = document.querySelector(
		'#customize-save-button-wrapper > #save'
	);

	if ( wp && wp.customize && saveButton ) {
		return func( {
			customize: wp.customize,
			previewBlocksInWidgetArea,
			saveButton,
		} );
	}
}
