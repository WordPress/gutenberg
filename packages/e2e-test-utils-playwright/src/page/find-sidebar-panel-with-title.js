/**
 * Finds the button responsible for toggling the sidebar panel with the provided title.
 *
 * @this {import('./').PageUtils}
 * @param {string} panelTitle The name of sidebar panel.
 *
 * @return {<Locator>} The locator for the button responsible for toggling the sidebar panel.
 */
export async function findSidebarPanelWithTitle( panelTitle ) {
	const panelSelector = this.page.locator(
		`.components-panel__body:has(button:has-text("${ panelTitle }"))`
	);

	return panelSelector;
}
