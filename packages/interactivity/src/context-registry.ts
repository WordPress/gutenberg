/**
 * Registry mapping DOM elements to the live context at that element's position
 * in the tree.
 *
 * The Interactivity API keeps each island's live (proxified) context objects
 * inside the preact component tree — they are not reachable from the DOM. This
 * registry bridges that gap: every element with directives registers the
 * context it rendered with, keyed by its DOM node. `getContextAt()` then walks
 * up from any element and returns the nearest registered context, which is the
 * effective context at that position.
 *
 * Used by `renderElement()` to give an inserted fragment the same live context
 * it would have had if it had been part of the original HTML at that position.
 *
 * Only elements that participate in a render register themselves. The registry
 * is a `WeakMap`, so entries are garbage-collected when elements are removed.
 */

const contextRegistry = new WeakMap<
	Element,
	{ client: object; server: object }
>();

/**
 * Registers (or updates) the context for a given element.
 *
 * Idempotent and cheap: setting the same object twice is a no-op beyond the
 * map write.
 *
 * @param element The DOM element whose position in the tree gets this context.
 * @param value   The context (`client`/`server`) rendered at that position.
 */
export const registerElementContext = (
	element: Element,
	value: { client: object; server: object }
) => {
	contextRegistry.set( element, value );
};

/**
 * Returns the live context at the given element's position, by walking up the
 * DOM until an element with a registered context is found.
 *
 * @param element The element whose context is requested.
 * @return The registered context, or `null` if no ancestor (including the
 *         element itself) has one.
 */
export const getContextAt = (
	element: Element
): { client: object; server: object } | null => {
	let current: Element | null = element;
	while ( current ) {
		const value = contextRegistry.get( current );
		if ( value ) {
			return value;
		}
		current = current.parentElement;
	}
	return null;
};
