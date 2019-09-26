export default function( node ) {
	// Only filter on DOM elements
	if ( ! node.getAttribute ) {
		return;
	}

	// Filter based on 'style' attribute
	const style = node.getAttribute( 'style' );

	// Convert "<a style='mso-comment-reference...'>text</a>" => "text"
	if ( style && style.indexOf( 'mso-comment-reference' ) !== -1 ) {
		node.outerHTML = node.innerHTML;
		return;
	}

	// Filter based on 'class' attribute
	const className = node.getAttribute( 'class' );

	// Remove "<span class=MsoCommentReference>...</span>"
	if ( className && className.indexOf( 'MsoCommentReference' ) !== -1 ) {
		node.remove();
		return;
	}

	// Remove "<div style='mso-element:comment-list'>...</div>"
	if ( style && style.indexOf( 'mso-element:comment-list' ) !== -1 ) {
		node.remove();
		return;
	}

	// Remove "<a class='msocomanchor'>...</a>"
	if ( className && className.indexOf( 'msocomanchor' ) !== -1 ) {
		node.remove();
		return;
	}

	// Remove "<span style='mso-special-character:comment'>...</span>"
	if ( style && style.indexOf( 'mso-special-character:comment' ) !== -1 ) {
		node.remove();
	}
}
