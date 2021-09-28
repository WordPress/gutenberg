/* eslint-disable jsdoc/valid-types */
/**
 * @param {Node | null | undefined} node
 * @return {node is Element} True if node is an Element node
 */
export default function isElement( node ) {
	/* eslint-enable jsdoc/valid-types */
	return !! node && node.nodeType === node.ELEMENT_NODE;
}
