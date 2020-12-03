/**
 * Clears the text selection on screen.
 */
export function clearSelection() {
	if ( window?.getSelection ) {
		const selection = window?.getSelection();
		if ( ! selection ) {
			return;
		}

		if ( selection.empty ) {
			// Chrome
			selection.empty();
		} else if ( selection.removeAllRanges ) {
			// Firefox
			selection.removeAllRanges();
		}
		// @ts-ignore IE specific property
	} else if ( document.selection ) {
		// @ts-ignore IE specific property
		document.selection.empty();
	}
}
