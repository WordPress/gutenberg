export function getComposedParent( element: Element ): Element | null {
	const ShadowRoot = element.ownerDocument.defaultView?.ShadowRoot;
	return (
		element.assignedSlot ??
		element.parentElement ??
		( ShadowRoot && element.parentNode instanceof ShadowRoot
			? element.parentNode.host
			: null )
	);
}
