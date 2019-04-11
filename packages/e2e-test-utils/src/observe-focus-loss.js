/**
 * Binds to the document on page load which throws an error if a `focusout`
 * event occurs without a related target (i.e. focus loss).
 */
export function observeFocusLoss() {
	page.on( 'load', () => {
		page.evaluate( () => {
			document.body.addEventListener( 'focusout', ( event ) => {
				if ( ! event.relatedTarget ) {
					throw new Error( 'Unexpected focus loss' );
				}
			} );
		} );
	} );
}
