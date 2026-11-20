/*
 * Adds the format boundary style to the document, once.
 */
export function addBoundaryStyle( ownerDocument: Document ) {
	const globalStyleId = 'rich-text-boundary-style';

	if ( ownerDocument.getElementById( globalStyleId ) ) {
		return;
	}

	const globalStyle = ownerDocument.createElement( 'style' );
	globalStyle.id = globalStyleId;
	// Only while the editing host has focus, be it the element or the canvas
	// root around it. Only the element with the selection renders a boundary.
	globalStyle.innerHTML = `[contenteditable="true"]:focus *[data-rich-text-format-boundary] {background-color: color-mix(in srgb, currentColor 20%, transparent)}`;
	ownerDocument.head.appendChild( globalStyle );
}
