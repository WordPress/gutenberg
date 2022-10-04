/* eslint-disable jsdoc/valid-types */
/**
 * @param {Node} node
 * @return {node is HTMLInputElement} Whether the node is an HTMLInputElement.
 */
export default function isHTMLInputElement( node ) {
	/* eslint-enable jsdoc/valid-types */
	return node?.nodeName === 'INPUT';
}
