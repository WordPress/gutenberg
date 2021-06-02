/**
 * Clears the text selection on screen.
 */
export function clearSelection() {
	if ( window?.getSelection ) {
		// eslint-disable-next-line @wordpress/no-global-get-selection
		const selection = window?.getSelection();
		if ( ! selection ) {
			return;
		}

		if ( selection.empty ) {
			// Chrome.
			selection.empty();
		} else if ( selection.removeAllRanges ) {
			// Firefox.
			selection.removeAllRanges();
		}
		// @ts-ignore IE specific property.
	} else if ( document.selection ) {
		// @ts-ignore IE specific property.
		document.selection.empty();
	}
}
