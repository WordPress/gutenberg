import warning from '@wordpress/warning';

/**
 * Runs a selector declared in a block's `block.json` against a node.
 *
 * A declared selector is data, not code, so an invalid one would otherwise
 * throw out of every conversion rather than only failing to match. It is
 * treated as matching nothing instead, and reported so the author finds out.
 *
 * @param node     Node to match.
 * @param selector CSS selector.
 *
 * @return Whether the node matches.
 */
export function matchesSelector( node: Element, selector: string ): boolean {
	try {
		return node.matches( selector );
	} catch {
		warning(
			`The "${ selector }" selector declared by a block is not valid CSS, so it matches nothing.`
		);
		return false;
	}
}
