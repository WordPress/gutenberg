/**
 * The canvas's own child that contains a given element.
 *
 * A press lands on whatever is deepest — a word inside a paragraph inside a
 * nested group — but what the canvas can move is its own child. Walking up to
 * it means pressing anywhere inside a container picks the container up, which
 * is what makes the whole block the drag handle.
 *
 * @param {?Element} target        The element the pointer went down on.
 * @param {?Element} canvasElement The canvas's element.
 * @return {?string} The child's client id, or null if the target is elsewhere.
 */
export function getCanvasChild( target, canvasElement ) {
	if ( ! target || ! canvasElement ) {
		return null;
	}

	let node = target;
	while ( node && node !== canvasElement ) {
		if ( node.parentElement === canvasElement ) {
			return node.dataset?.block ?? null;
		}
		node = node.parentElement;
	}

	return null;
}
