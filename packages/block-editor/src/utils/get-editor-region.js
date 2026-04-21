/**
 * Gets the editor region for a given editor canvas element or
 * returns the passed element if no region is found
 *
 * @param { Object } editor The editor canvas element.
 * @return { Object } The editor region or given editor element
 */
export default function getEditorRegion( editor ) {
	if ( ! editor ) {
		return null;
	}

	// If there are multiple editors, we need to find the iframe that contains our contentRef to make sure
	// we're focusing the region that contains this editor.
	const editorCanvas =
		Array.from(
			document.querySelectorAll( 'iframe[name="editor-canvas"]' ).values()
		).find( ( iframe ) => {
			// Find the iframe that contains our contentRef
			const iframeDocument =
				iframe.contentDocument || iframe.contentWindow.document;

			return iframeDocument === editor.ownerDocument;
		} ) ?? editor;

	// The region is provided by the editor, not the block-editor.
	// We should send focus to the region if one is available to reuse the
	// same interface for navigating landmarks. If no region is available,
	// use the canvas instead.
	return editorCanvas?.closest( '[role="region"]' ) ?? editorCanvas;
}
