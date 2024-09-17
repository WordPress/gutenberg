/** @typedef {import('puppeteer-core').ElementHandle} ElementHandle */

/**
 * Finds a sidebar panel with the provided title.
 *
 * @param {string} panelTitle The name of sidebar panel.
 *
 * @return {?ElementHandle} Object that represents an in-page DOM element.
 */
export async function findSidebarPanelToggleButtonWithTitle( panelTitle ) {
	const buttons = await page.$x(
		`//div[contains(@class,"editor-sidebar")]//button[@class="components-button components-panel__body-toggle"][contains(text(),"${ panelTitle }")]`
	);
	return buttons[ 0 ];
}
