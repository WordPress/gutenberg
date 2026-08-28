import { addQueryArgs } from '@wordpress/url';

/**
 * Returns the URL a meta boxes iframe loads: the meta box loader URL with
 * the parameter that trims the classic screen down to the given locations.
 *
 * @param {string} location `main` for the normal and advanced locations
 *                          rendered in the bottom pane, or `side` for the
 *                          side location rendered in the settings sidebar.
 *
 * @return {string|undefined} The URL, if the meta box loader URL is known.
 */
export function getMetaBoxesIframeUrl( location = 'main' ) {
	if ( ! window._wpMetaBoxUrl ) {
		return undefined;
	}
	return addQueryArgs( window._wpMetaBoxUrl, {
		'gutenberg-meta-box-iframe': location,
	} );
}

/**
 * Returns the name of the iframe rendering the given meta box locations.
 *
 * @param {string} location `main` or `side`.
 *
 * @return {string} The iframe name.
 */
export function getMetaBoxesIframeName( location = 'main' ) {
	return location === 'side'
		? 'gutenberg-meta-boxes-side'
		: 'gutenberg-meta-boxes';
}

/**
 * Collects the values of the form fields inside the meta boxes of the
 * given document, with the browser's own form serialization.
 *
 * The classic screen renders the meta boxes inside one form along with
 * the title and content fields, which must not be submitted. Disabled
 * fields are excluded from `FormData`, so the fields outside the meta
 * boxes are disabled while the data is constructed.
 *
 * @param {Document} frameDocument A meta boxes iframe document.
 *
 * @return {FormData} The collected fields.
 */
export function collectMetaBoxFieldsData( frameDocument ) {
	const form = frameDocument.getElementById( 'post' );
	if ( ! form ) {
		return new window.FormData();
	}
	const outsideFields = [ ...form.elements ].filter(
		( field ) =>
			! field.disabled &&
			! field.closest( '.meta-box-sortables .postbox' )
	);
	for ( const field of outsideFields ) {
		field.disabled = true;
	}
	try {
		return new frameDocument.defaultView.FormData( form );
	} finally {
		for ( const field of outsideFields ) {
			field.disabled = false;
		}
	}
}
