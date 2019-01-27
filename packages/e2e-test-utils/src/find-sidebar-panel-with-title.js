/**
 * External dependencies
 */
import { first } from 'lodash';

/**
 * Finds a sidebar panel with the provided title.
 *
 * @param {string} panelTitle The name of sidebar panel.
 *
 * @return {?ElementHandle} Object that represents an in-page DOM element.
 */
export async function findSidebarPanelWithTitle( panelTitle ) {
	return first( await page.$x( `//div[@class="edit-post-sidebar"]//button[@class="components-button components-panel__body-toggle"][contains(text(),"${ panelTitle }")]` ) );
}
