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
	const elementPoint = await element.clickablePoint();
	await page.mouse.dragAndDrop( elementPoint, {
		x: elementPoint.x + delta.x,
		y: elementPoint.y + delta.y,
	} );
}
