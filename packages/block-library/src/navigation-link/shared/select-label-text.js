/**
 * Focus the Link label text and select it.
 *
 * @param {Object} ref React ref object pointing to the label element.
 */
export function selectLabelText( ref ) {
	ref.current.focus();
	const { ownerDocument } = ref.current;
	const { defaultView } = ownerDocument;
	const selection = defaultView.getSelection();
	const range = ownerDocument.createRange();
	// Get the range of the current ref contents so we can add this range to the selection.
	range.selectNodeContents( ref.current );
	selection.removeAllRanges();
	selection.addRange( range );
}
