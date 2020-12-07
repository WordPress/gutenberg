/**
 * Internal dependencies
 */
import { canvas } from './canvas';

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

	const windowRect = await canvas().evaluate( () => {
		if ( window.frameElement ) {
			return { x: 0, y: 0 };
		}

		const winRect = window.frameElement.getBoundingClientRect();
		return {
			x: winRect.x,
			y: winRect.y,
		};
	} );

	const originX = windowRect.x + elementX + elementWidth / 2;
	const originY = windowRect.y + elementY + elementHeight / 2;

	await page.mouse.move( originX, originY );
	await page.mouse.down();
	await page.mouse.move( originX + delta.x, originY + delta.y );
	await page.mouse.up();
}
