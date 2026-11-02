import { createBlock } from '@wordpress/blocks';
import { _x } from '@wordpress/i18n';

/**
 * Creates the inner blocks of the File block download button.
 *
 * @param {Object} options      The button options.
 * @param {string} options.url  The URL of the file.
 * @param {string} options.text The button text. Defaults to "Download".
 * @return {Object} A Buttons block that holds the download Button block.
 */
export const createDownloadButtons = ( {
	url,
	text = _x( 'Download', 'button label' ),
} ) =>
	createBlock( 'core/buttons', {}, [
		createBlock( 'core/button', {
			url,
			text,
			download: true,
			// Keeps the button linked to the file. `url` is still saved, so
			// the markup is correct where bindings are not processed.
			metadata: { bindings: { url: { source: 'core/file-data' } } },
		} ),
	] );

/**
 * Uses a combination of user agent matching and feature detection to determine whether
 * the current browser supports rendering PDFs inline.
 *
 * @return {boolean} Whether or not the browser supports inline PDFs.
 */
export const browserSupportsPdfs = () => {
	// Use native feature detection if available.
	if ( window.navigator.pdfViewerEnabled ) {
		return true;
	}

	// Most mobile devices include "Mobi" in their UA.
	if ( window.navigator.userAgent.indexOf( 'Mobi' ) > -1 ) {
		return false;
	}

	// Android tablets are the notable exception.
	if ( window.navigator.userAgent.indexOf( 'Android' ) > -1 ) {
		return false;
	}

	// iPad pretends to be a Mac.
	if (
		window.navigator.userAgent.indexOf( 'Macintosh' ) > -1 &&
		window.navigator.maxTouchPoints &&
		window.navigator.maxTouchPoints > 2
	) {
		return false;
	}

	// IE only supports PDFs when there's an ActiveX object available for it.
	if (
		!! ( window.ActiveXObject || 'ActiveXObject' in window ) &&
		! (
			createActiveXObject( 'AcroPDF.PDF' ) ||
			createActiveXObject( 'PDF.PdfCtrl' )
		)
	) {
		return false;
	}

	return true;
};

/**
 * Helper function for creating ActiveX objects, catching any errors that are thrown
 * when it's generated.
 *
 * @param {string} type The name of the ActiveX object to create.
 * @return {window.ActiveXObject|undefined} The generated ActiveXObject, or null if it failed.
 */
const createActiveXObject = ( type ) => {
	let ax;
	try {
		ax = new window.ActiveXObject( type );
	} catch {
		ax = undefined;
	}
	return ax;
};
