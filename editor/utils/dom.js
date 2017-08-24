/**
 * Check whether the selection touches an edge of the container
 *
 * @param  {Element} container DOM Element
 * @param  {Boolean} reverse   Reverse means check if it touches the start of the container
 * @return {Boolean}           Is Edge or not
 */
export function isEdge( container, reverse = false ) {
	const isInputOrTextarea = [ 'INPUT', 'TEXTAREA' ].indexOf( container.tagName ) !== -1;
	const selection = window.getSelection();
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

	function isStartOfContainer() {
		if ( isInputOrTextarea ) {
			return container.selectionStart === 0 && container.selectionStart === container.selectionEnd;
		}
		if ( ! container.isContentEditable ) {
			return true;
		}
		if ( range.startOffset !== 0 || ! range.collapsed ) {
			return false;
		}
		const start = range.startContainer;
		let element = start;
		while ( element !== container ) {
			const child = element;
			element = element.parentNode;
			if ( element.firstChild !== child ) {
				return false;
			}
		}
		return true;
	}

	function isEndOfContainer() {
		if ( isInputOrTextarea ) {
			return container.value.length === container.selectionStart && container.selectionStart === container.selectionEnd;
		}
		if ( ! container.isContentEditable ) {
			return true;
		}
		if ( range.endOffset !== range.endContainer.textContent.length || ! range.collapsed ) {
			return false;
		}
		const start = range.endContainer;
		let element = start;
		while ( element !== container ) {
			const child = element;
			element = element.parentNode;
			if ( element.lastChild !== child ) {
				return false;
			}
		}
		return true;
	}

	return reverse ? isStartOfContainer() : isEndOfContainer();
}

/**
 * Places the caret at start or end of a given element
 *
 * @param  {Element} container DOM Element
 * @param  {Boolean} start     Position: Start or end of the element
 */
export function placeCaretAtEdge( container, start = false ) {
	const isInputOrTextarea = [ 'INPUT', 'TEXTAREA' ].indexOf( container.tagName ) !== -1;
	if ( isInputOrTextarea ) {
		container.focus();
		setTimeout( () => {
			if ( start ) {
				container.selectionStart = 0;
				container.selectionEnd = 0;
			} else {
				container.selectionStart = container.value.length;
				container.selectionEnd = container.value.length;
			}
		} );
		return;
	}

	function createCaretPlacer( atStart ) {
		return ( el ) => {
			el.focus();
			if (
				typeof window.getSelection !== 'undefined' &&
				typeof document.createRange !== 'undefined'
			) {
				const range = document.createRange();
				range.selectNodeContents( el );
				range.collapse( atStart );
				const sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange( range );
			} else if ( typeof document.body.createTextRange !== 'undefined' ) {
				const textRange = document.body.createTextRange();
				textRange.moveToElementText( el );
				textRange.collapse( atStart );
				textRange.select();
			}
		};
	}
	const placeCaretAtStart = createCaretPlacer( true );
	const placeCaretAtEnd = createCaretPlacer( false );

	if ( start ) {
		placeCaretAtStart( container );
	} else {
		placeCaretAtEnd( container );
	}
}
