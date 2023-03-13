/**
 * Adds an event listener to the document which throws an error if there is a
 * loss of focus.
 */
export async function enableFocusLossObservation() {
	await page.evaluate( () => {
		if ( window._detectFocusLoss ) {
			document.body.removeEventListener(
				'focusout',
				window._detectFocusLoss
			);
		}

		window._detectFocusLoss = ( event ) => {
			if ( ! event.relatedTarget ) {
				throw new Error( 'Unexpected focus loss' );
			}
		};

		document.body.addEventListener( 'focusout', window._detectFocusLoss );
	} );
}

/**
 * Removes the focus loss listener that `enableFocusLossObservation()` adds.
 */
export async function disableFocusLossObservation() {
	await page.evaluate( () => {
		if ( window._detectFocusLoss ) {
			document.body.removeEventListener(
				'focusout',
				window._detectFocusLoss
			);
		}
	} );
}
