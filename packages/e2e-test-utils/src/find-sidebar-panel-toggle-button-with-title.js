/**
 * External dependencies
 */
import { first } from 'lodash';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

/**
 * Finds a sidebar panel with the provided title.
 *
 * @param {string} panelTitle The name of sidebar panel.
 *
 * @return {?ElementHandle} Object that represents an in-page DOM element.
 */
export async function findSidebarPanelToggleButtonWithTitle( panelTitle ) {
	return first( await page.$x( `//div[contains(@class,"edit-post-sidebar")]//button[@class="components-button components-panel__body-toggle"][contains(text(),"${ panelTitle }")]` ) );
}
