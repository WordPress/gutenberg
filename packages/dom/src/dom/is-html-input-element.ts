/**
 * @param {Node|null|undefined} node
 * @return {node is HTMLInputElement} Whether the node is an HTMLInputElement.
 */
export default function isHTMLInputElement(
	node: Node | null | undefined
): node is HTMLInputElement {
	return node?.nodeName === 'INPUT';
}
