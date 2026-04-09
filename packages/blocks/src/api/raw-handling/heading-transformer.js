/**
 * Transforms paragraphs with heading semantics into proper heading tags.
 *
 * This handles cases where content (like from Microsoft Word Online) comes in as
 * <p> tags with role="heading" and aria-level attributes, and converts them to
 * proper <h1>, <h2>, etc. tags.
 *
 * @param {Node} node The node to check and potentially transform.
 */
export default function headingTransformer( node ) {
	if ( node.nodeType !== node.ELEMENT_NODE ) {
		return;
	}

	// Check if this is a paragraph with heading semantics.
	if (
		node.tagName === 'P' &&
		node.getAttribute( 'role' ) === 'heading' &&
		node.hasAttribute( 'aria-level' )
	) {
		const level = parseInt( node.getAttribute( 'aria-level' ), 10 );

		// To ensure valid heading level (1-6).
		if ( level >= 1 && level <= 6 ) {
			const headingTag = `H${ level }`;
			const newHeading = node.ownerDocument.createElement( headingTag );

			// Copying all attributes except role and aria-level.
			Array.from( node.attributes ).forEach( ( attr ) => {
				if ( attr.name !== 'role' && attr.name !== 'aria-level' ) {
					newHeading.setAttribute( attr.name, attr.value );
				}
			} );

			while ( node.firstChild ) {
				newHeading.appendChild( node.firstChild );
			}

			// Replacing the paragraph with the heading.
			node.parentNode.replaceChild( newHeading, node );
		}
	}
}
