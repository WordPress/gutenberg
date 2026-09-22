/**
 * Transforms paragraphs with heading semantics into proper heading tags.
 *
 * This handles cases where content (like from Microsoft Word Online) comes in as
 * <p> tags with role="heading" and aria-level attributes, and converts them to
 * proper <h1>, <h2>, etc. tags.
 *
 * @param node The node to check and potentially transform.
 */
export default function headingTransformer( node: Node ): void {
	if ( node.nodeType !== node.ELEMENT_NODE ) {
		return;
	}

	// Check if this is a paragraph with heading semantics.
	const element = node as HTMLElement;
	if (
		element.tagName === 'P' &&
		element.getAttribute( 'role' ) === 'heading' &&
		element.hasAttribute( 'aria-level' )
	) {
		const level = parseInt( element.getAttribute( 'aria-level' )!, 10 );

		// To ensure valid heading level (1-6).
		if ( level >= 1 && level <= 6 ) {
			const headingTag = `H${ level }`;
			const newHeading =
				element.ownerDocument.createElement( headingTag );

			// Copying all attributes except role and aria-level.
			Array.from( element.attributes ).forEach( ( attr ) => {
				if ( attr.name !== 'role' && attr.name !== 'aria-level' ) {
					newHeading.setAttribute( attr.name, attr.value );
				}
			} );

			while ( element.firstChild ) {
				newHeading.appendChild( element.firstChild );
			}

			// Replacing the paragraph with the heading.
			element.parentNode!.replaceChild( newHeading, element );
		}
	}
}
