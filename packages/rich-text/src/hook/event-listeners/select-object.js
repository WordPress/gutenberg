export default () => ( element ) => {
	function onClick( event ) {
		const { target } = event;

		// If the child element has no text content, it must be an object.
		if (
			target === element ||
			( target.textContent && target.isContentEditable )
		) {
			return;
		}

		const { ownerDocument } = target;
		const { defaultView } = ownerDocument;
		const selection = defaultView.getSelection();

		// If it's already selected, do nothing and let default behavior happen.
		// This means it's "click-through".
		if ( selection.containsNode( target ) ) {
			return;
		}

		const range = ownerDocument.createRange();
		// If the target is within a non editable element, select the non
		// editable element.
		const nodeToSelect = target.isContentEditable
			? target
			: target.closest( '[contenteditable]' );

		range.selectNode( nodeToSelect );
		selection.removeAllRanges();
		selection.addRange( range );

		event.preventDefault();
	}

	function onFocusIn( event ) {
		// When there is incoming focus from a link, select the object.
		if (
			event.relatedTarget &&
			! element.contains( event.relatedTarget ) &&
			event.relatedTarget.tagName === 'A'
		) {
			onClick( event );
		}
	}

	element.addEventListener( 'click', onClick );
	element.addEventListener( 'focusin', onFocusIn );
	return () => {
		element.removeEventListener( 'click', onClick );
		element.removeEventListener( 'focusin', onFocusIn );
	};
};
