/**
 * Given a DOM node, removes it from the DOM.
 *
 * @param {Element} node Node to be removed.
 * @return {void}
 */
export default function remove( node ) {
	node.parentNode.removeChild( node );
}
