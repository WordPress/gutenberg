/**
 * Clicks an element, drags a particular distance and releases the mouse button.
 *
 * @param {Object} element The puppeteer element handle.
 * @param {Object} delta   Object containing movement distances.
 * @param {number} delta.x Horizontal distance to drag.
 * @param {number} delta.y Vertical distance to drag.
 *
 * @return {Promise} Promise resolving when drag completes.
 */
export async function dragAndResize( element, delta ) {
	const {
		x: elementX,
		y: elementY,
		width: elementWidth,
		height: elementHeight,
	} = await element.boundingBox();

	const originX = elementX + elementWidth / 2;
	const originY = elementY + elementHeight / 2;

	await page.mouse.move( originX, originY );
	await page.mouse.down();
	await page.mouse.move( originX + delta.x, originY + delta.y );
	await page.mouse.up();
}
