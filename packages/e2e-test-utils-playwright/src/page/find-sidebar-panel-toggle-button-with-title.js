/**
 * Finds a sidebar panel with the provided title.
 *
 * @this {import('./').PageUtils}
 * @param {string} panelTitle The name of sidebar panel.
 *
 * @return {<Locator>} The locator for the sidebar panel toggle button.
 */
export async function findSidebarPanelToggleButtonWithTitle( panelTitle ) {
	return this.page.locator(
		`button.components-button.components-panel__body-toggle:has-text("${ panelTitle }")`
	);
}
