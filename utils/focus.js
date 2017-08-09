/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Node names for elements which can receive focus
 *
 * @type {Array}
 */
const FOCUSABLE_NODE_NAMES = [
	'INPUT',
	'SELECT',
	'TEXTAREA',
	'BUTTON',
	'OBJECT',
];

/**
 * Returns true if the specified node can receive focus, or false otherwise.
 *
 * @param  {HTMLElement} node Node to check
 * @return {Boolean}          Whether the node can receive focus
 */
export function isFocusable( node ) {
	if ( ! node ) {
		return false;
	}

	if ( node.tabIndex < 0 ) {
		return false;
	} else if ( includes( FOCUSABLE_NODE_NAMES, node.nodeName ) ) {
		return ! node.disabled;
	} else if ( 'A' === node.nodeName || 'AREA' === node.nodeName ) {
		return node.hasAttribute( 'href' );
	}

	return node.tabIndex >= 0;
}

/**
 * Returns the first focusable element within the specified node, or undefined
 * if there are no focusable elements.
 *
 * @param  {HTMLElement} node Context in which to find focusable
 * @return {HTMLElement}      First focusable element
 */
export function findFocusable( node ) {
	if ( ! node ) {
		return;
	}

	return findFirstFocusable( node.firstChild, node );
}

/**
 * Returns the first focusable element starting from specified node:
 *  - If node is focusable, returns node
 *  - If node contains a descendant which is focusable, returns descendant
 *  - If node has a focusable sibling, returns sibling
 *  - Otherwise, continues through parents following same guidelines until
 *    reaching context. If context is reached, the function returns undefined.
 *
 * @param  {HTMLElement}  node    Starting node
 * @param  {?HTMLElement} context Context in which to find focusable
 * @return {HTMLElement}          First focusable element
 */
export function findFirstFocusable( node, context = document.body ) {
	if ( ! node || node === context ) {
		return;
	}

	// Starting node is focusable?
	if ( isFocusable( node ) ) {
		return node;
	}

	// Traverse into children
	if ( node.firstChild ) {
		return findFirstFocusable( node.firstChild, context );
	}

	// Find next sibling or parent
	let nextSibling;
	while ( ! ( nextSibling = node.nextSibling ) ) {
		node = node.parentNode;

		// Terminate if reached context
		if ( node === context ) {
			return;
		}
	}

	// Find in sibling or parent's sibling
	return findFirstFocusable( nextSibling, context );
}
