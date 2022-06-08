/**
 * External dependencies
 */
import type { Locator } from '@playwright/test';
/**
 * Internal dependencies
 */
import type { Editor } from './index';

type Delta = {
	x: number;
	y: number;
};

/**
 * Clicks an element, drags a particular distance and releases the mouse button.
 *
 * @param {Editor} this
 * @param {Object} element The puppeteer element handle.
 * @param {Object} delta   Object containing movement distances.
 * @param {number} delta.x Horizontal distance to drag.
 * @param {number} delta.y Vertical distance to drag.
 *
 * @return {Promise} Promise resolving when drag completes.
 */
export async function dragAndResize(
	this: Editor,
	element: Locator,
	delta: Delta
) {
	const elementPoint = await element.boundingBox();
	if ( elementPoint ) {
		await this.page.mouse.move( elementPoint.x, elementPoint.y );
		await this.page.mouse.down();
		await this.page.mouse.move(
			elementPoint.x + delta.x,
			elementPoint.y + delta.y
		);
		await this.page.mouse.up();
	}
}
