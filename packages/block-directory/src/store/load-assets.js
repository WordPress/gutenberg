import apiFetch from '@wordpress/api-fetch';

/**
 * Returns the editor canvas iframe, when the canvas is iframed.
 *
 * Modern block editors render the blocks inside an iframe. When the canvas is
 * not iframed (or the iframe is not there yet) this returns `null`.
 *
 * @return {HTMLIFrameElement|null} The editor canvas iframe, or null.
 */
const getEditorCanvasIframe = () =>
	document.querySelector( 'iframe[name="editor-canvas"]' );

/**
 * Mirrors a newly added stylesheet into the editor canvas iframe.
 *
 * `loadAssets()` appends the assets of a freshly installed block to the main
 * document. That is enough for scripts, which must run in the editor's own
 * context, but styles have to be present inside the editor canvas document as
 * well. Otherwise a block installed from the Block Directory renders unstyled
 * until the editor is reloaded, because the canvas only picks up the styles
 * that existed when it was created.
 *
 * @see https://github.com/WordPress/gutenberg/issues/63762
 *
 * @param {HTMLElement} node The stylesheet element added to the main document.
 */
const mirrorStyleIntoCanvasIframe = ( node ) => {
	const canvasDocument = getEditorCanvasIframe()?.contentDocument;

	if ( ! canvasDocument?.head ) {
		return;
	}

	// Avoid injecting a stylesheet the canvas already has.
	if ( node.id && canvasDocument.getElementById( node.id ) ) {
		return;
	}

	canvasDocument.head.appendChild( node.cloneNode( true ) );
};

/**
 * Load an asset for a block.
 *
 * This function returns a Promise that will resolve once the asset is loaded,
 * or in the case of Stylesheets and Inline JavaScript, will resolve immediately.
 *
 * @param {HTMLElement} el A HTML Element asset to inject.
 *
 * @return {Promise} Promise which will resolve when the asset is loaded.
 */
export const loadAsset = ( el ) => {
	return new Promise( ( resolve, reject ) => {
		/*
		 * Reconstruct the passed element, this is required as inserting the Node directly
		 * won't always fire the required onload events, even if the asset wasn't already loaded.
		 */
		const newNode = document.createElement( el.nodeName );

		[ 'id', 'rel', 'src', 'href', 'type' ].forEach( ( attr ) => {
			if ( el[ attr ] ) {
				newNode[ attr ] = el[ attr ];
			}
		} );

		// Append inline <script> contents.
		if ( el.innerHTML ) {
			newNode.appendChild( document.createTextNode( el.innerHTML ) );
		}

		newNode.onload = () => resolve( true );
		newNode.onerror = () => reject( new Error( 'Error loading asset.' ) );

		document.body.appendChild( newNode );

		// Styles must also reach the editor canvas iframe.
		if (
			'link' === newNode.nodeName.toLowerCase() &&
			'stylesheet' === newNode.rel
		) {
			mirrorStyleIntoCanvasIframe( newNode );
		}

		// Resolve Stylesheets and Inline JavaScript immediately.
		if (
			'link' === newNode.nodeName.toLowerCase() ||
			( 'script' === newNode.nodeName.toLowerCase() && ! newNode.src )
		) {
			resolve();
		}
	} );
};

/**
 * Load the asset files for a block
 */
export async function loadAssets() {
	/*
	 * Fetch the current URL (post-new.php, or post.php?post=1&action=edit) and compare the
	 * JavaScript and CSS assets loaded between the pages. This imports the required assets
	 * for the block into the current page while not requiring that we know them up-front.
	 * In the future this can be improved by reliance upon block.json and/or a script-loader
	 * dependency API.
	 */
	const response = await apiFetch( {
		url: document.location.href,
		parse: false,
	} );

	const data = await response.text();

	const doc = new window.DOMParser().parseFromString( data, 'text/html' );

	const newAssets = Array.from(
		doc.querySelectorAll( 'link[rel="stylesheet"],script' )
	).filter( ( asset ) => asset.id && ! document.getElementById( asset.id ) );

	/*
	 * Load each asset in order, as they may depend upon an earlier loaded script.
	 * Stylesheets and Inline Scripts will resolve immediately upon insertion.
	 */
	for ( const newAsset of newAssets ) {
		await loadAsset( newAsset );
	}
}
