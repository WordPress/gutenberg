/**
 * Measures how far single-line text extends beyond its element, in pixels.
 *
 * @param element Element containing the text.
 */
export function measureTextOverflow( element: HTMLElement ): number {
	const range = element.ownerDocument.createRange();
	range.selectNodeContents( element );
	// Integer scroll measurements miss clips smaller than a pixel. JSDOM
	// has no Range geometry, so use scroll measurements there.
	return typeof range.getBoundingClientRect === 'function'
		? range.getBoundingClientRect().width -
				element.getBoundingClientRect().width
		: element.scrollWidth - element.clientWidth;
}
