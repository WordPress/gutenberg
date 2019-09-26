export default function( node ) {
	// Only filter on DOM elements
	if ( ! node.getAttribute ) {
		return;
	}

	// Filters are all based on 'style' attributes
	const style = node.getAttribute( 'style' );

	// Remove "<a style='mso-footnote-id...'>...</a>"
	// Note: for now we are just stripping out footnotes
	if ( style && style.indexOf( 'mso-footnote-id' ) !== -1 ) {
		node.remove();
		return;
	}

	// Remove "<div style='mso-element:footnote-list'>...</div>"
	// Note: for now we are just stripping out footnotes
	if ( style && style.indexOf( 'mso-element:footnote-list' ) !== -1 ) {
		node.remove();
	}
}
