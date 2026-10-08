/**
 * The block a press should pick up, given where the pointer went down.
 *
 * A press lands on whatever is deepest — a word inside a paragraph inside a
 * nested group — but what the canvas can move is its own child. Walking up to
 * it means pressing anywhere inside a container picks the container up, which
 * is what makes the whole block the drag handle.
 *
 * What the canvas absorbs is stepped over. Pressing an item in a column would
 * otherwise pick up the whole Columns block, which is the very block the first
 * drag dissolves into the section — so the press would be picking up something
 * about to stop existing. What it picks up instead is the first block that
 * survives the absorption, which is what becomes the canvas's child.
 *
 * @param {?Element} target        The element the pointer went down on.
 * @param {?Element} canvasElement The canvas's element.
 * @param {Function} [isAbsorbed]  Whether the canvas dissolves a block rather
 *                                 than placing it. See `isAbsorbable`.
 * @return {?string} The block's client id, or null if the target is elsewhere.
 */
export function getCanvasChild(
	target,
	canvasElement,
	isAbsorbed = () => false
) {
	if ( ! target || ! canvasElement ) {
		return null;
	}

	// The block elements between the canvas and the target, outermost first.
	const chain = [];
	let node = target;
	while ( node && node !== canvasElement ) {
		if ( node.dataset?.block ) {
			chain.unshift( node.dataset.block );
		}
		node = node.parentElement;
	}
	if ( ! node ) {
		// Walked past the canvas without meeting it: the press was elsewhere.
		return null;
	}

	// Step down past everything the canvas dissolves. Whatever is left is a
	// block the canvas places, so it is the block to pick up.
	let index = 0;
	while ( index < chain.length && isAbsorbed( chain[ index ] ) ) {
		index += 1;
	}

	return chain[ index ] ?? null;
}
