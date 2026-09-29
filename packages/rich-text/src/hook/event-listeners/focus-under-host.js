/**
 * Under an editing host the element is not a focus target: it has no
 * `contenteditable` attribute of its own. Keep `focus()` working: place the
 * caret in the element and focus the host instead.
 *
 * @param {Object} props Rich text hook props.
 *
 * @return {Function} Ref effect.
 */
export default ( props ) => ( element ) => {
	const { ownerDocument } = element;
	const { focus: nativeFocus } = element;

	element.focus = ( options ) => {
		const host = element.parentElement?.closest(
			'[contenteditable="true"]'
		);

		if ( ! host || element.hasAttribute( 'contenteditable' ) ) {
			nativeFocus.call( element, options );
			return;
		}

		const { record, isSelected, applyRecord } = props.current;
		const selection = ownerDocument.defaultView.getSelection();

		// Restore the caret from the record, as the focus handler does for
		// a focus target, or place it at the start.
		if ( ! element.contains( selection.anchorNode ) ) {
			if ( isSelected && record.current.start !== undefined ) {
				applyRecord( record.current );
			} else {
				selection.collapse( element, 0 );
			}
		}

		if (
			ownerDocument.activeElement !== host ||
			! ownerDocument.hasFocus()
		) {
			const range = selection.getRangeAt( 0 ).cloneRange();
			host.focus( { preventScroll: true, ...options } );
			// Gecko moves the selection when an editing host takes focus
			// instead of adopting the one within it.
			if ( ! element.contains( selection.anchorNode ) ) {
				selection.removeAllRanges();
				selection.addRange( range );
			}
		}
	};

	return () => {
		delete element.focus;
	};
};
