/**
 * Browser dependencies
 */
const { ELEMENT_NODE, TEXT_NODE } = window.Node;

function getCursorStart( /* node */ ) {
	// NOTE: In the future, we may want to skip some non-inhabitable positions in some nodes
	return 0;
}

function getCursorEnd( node ) {
	// NOTE: In the future, this might be a place to ignore special characters that browsers ignore
	if ( node.nodeType === TEXT_NODE ) {
		return node.nodeValue.length;
	}

	// We may need exceptions for other empty tags as well (e.g. hr, br, input)
	if ( node.nodeType === ELEMENT_NODE && node.nodeName.toLowerCase() === 'img' ) {
		return 1;
	}

	// Non text nodes have a last cursor position of their number of children
	return node.childNodes.length;
}

function isBr( node ) {
	return node.nodeType === ELEMENT_NODE && node.nodeName.toLowerCase() === 'br';
}

function getFilteredCursorEnd( node ) {
	const len = node.childNodes.length;
	if ( len > 0 ) {
		const hasBrLast = isBr( node.childNodes[ len - 1 ] );
		return hasBrLast ? len - 1 : len;
	}

	return len;
}

/**
 * Check whether the offset is at the start of the node
 *
 * @param {Element} node    the DOM element
 * @param {Integer} offset  the offset
 * @return {Boolean}        whether or not the offset is at the first cursor position in node
 */
function isAtCursorStart( node, offset ) {
	const nodeStart = getCursorStart( node );
	return nodeStart === offset;
}

/**
 * Check whether the offset is at the end of the node
 *
 * @param {Element} node    the DOM element
 * @param {Integer} offset  the offset
 * @return {Boolean}        whether or not the offset is at the last cursor position in node
 */
function isAtCursorEnd( node, offset ) {
	const nodeEnd = getCursorEnd( node );
	return nodeEnd === offset || offset === getFilteredCursorEnd( node );
}

/**
 * Check whether the selection touches an edge of the container
 *
 * @param  {Element} container DOM Element
 * @param  {Boolean} start     Reverse means check if it touches the start of the container
 * @return {Boolean}           Is Edge or not
 */
export function isEdge( { container, start = false } ) {
	if ( [ 'INPUT', 'TEXTAREA' ].indexOf( container.tagName ) !== -1 ) {
		if ( container.selectionStart !== container.selectionEnd ) {
			return false;
		}

		const edge = start ? 0 : container.value.length;
		return container.selectionStart === edge;
	}

	if ( ! container.isContentEditable ) {
		return true;
	}

	const selection = window.getSelection();
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;
	const position = start ? 'start' : 'end';
	const order = start ? 'first' : 'last';
	const offset = range[ `${ position }Offset` ];

	let node = range.startContainer;

	if ( ! range || ! range.collapsed ) {
		return false;
	}

	if ( start && ! isAtCursorStart( node, offset ) ) {
		return false;
	}

	if ( ! start && ! isAtCursorEnd( node, offset ) ) {
		return false;
	}

	while ( node !== container ) {
		const parentNode = node.parentNode;

		if ( parentNode[ `${ order }Child` ] !== node ) {
			return false;
		}

		node = parentNode;
	}

	return true;
}

/**
 * Places the caret at start or end of a given element
 *
 * @param  {Element} container DOM Element
 * @param  {Boolean} start     Position: Start or end of the element
 */
export function placeCaretAtEdge( { container, start = false } ) {
	const isInputOrTextarea = [ 'INPUT', 'TEXTAREA' ].indexOf( container.tagName ) !== -1;

	// Inputs and Textareas
	if ( isInputOrTextarea ) {
		container.focus();
		const offset = start ? 0 : container.value.length;
		container.selectionStart = offset;
		container.selectionEnd = offset;
		return;
	}

	// Content editables
	const range = document.createRange();
	range.selectNodeContents( container );
	range.collapse( start );
	const sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange( range );
	container.focus();
}
