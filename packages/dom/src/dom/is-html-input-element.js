/**
 * @param {Node} node
 * @return {node is HTMLInputElement} Whether the node is an HTMLInputElement.
 */
export default function isHTMLInputElement( node ) {
	return node?.nodeName === 'INPUT';
}
