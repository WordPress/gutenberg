/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

/**
 * Finds the button responsible for toggling the sidebar panel with the provided title.
 *
 * @param {string} panelTitle The name of sidebar panel.
 *
 * @return {Promise<ElementHandle|undefined>} Object that represents an in-page DOM element.
 */
export async function findSidebarPanelWithTitle( panelTitle ) {
	const panelToggleSelector = `//div[contains(@class, "edit-post-sidebar")]//button[contains(@class, "components-panel__body-toggle") and contains(text(),"${ panelTitle }")]`;
	const panelSelector = `${ panelToggleSelector }/ancestor::*[contains(concat(" ", @class, " "), " components-panel__body ")]`;
	return await page.waitForXPath( panelSelector );
}
