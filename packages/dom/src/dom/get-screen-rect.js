/**
 * Gets an element's true screen space rect, offsetting any intervening iFrames
 * in the element's ancestry.
 *
 * @param {Element}  element The dom element to return the rect.
 * @param {?DOMRect} rect    The rect to offset. Only use if you already have `element`'s rect,
 *                           this will save a call to `getBoundingClientRect`.
 *
 * @return {DOMRect|undefined} The rect offset by any parent iFrames.
 */
export default function getScreenRect( element, rect ) {
	const frame = element?.ownerDocument?.defaultView?.frameElement;

	// Return early when there's no parent iframe.
	if ( ! frame ) {
		return rect ?? element.getBoundingClientRect();
	}

	const frameRect = frame?.getBoundingClientRect();
	rect = rect ?? element?.getBoundingClientRect();

	const offsetRect = new window.DOMRect(
		rect.x + ( frameRect?.left ?? 0 ),
		rect.y + ( frameRect?.top ?? 0 ),
		rect.width,
		rect.height
	);

	// Perform a tail recursion and continue offsetting
	// by the next parent iframe.
	return getScreenRect( frame, offsetRect );
}
