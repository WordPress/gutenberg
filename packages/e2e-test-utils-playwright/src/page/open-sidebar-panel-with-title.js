/**
 * Open the sidebar panel with the given title.
 *
 * @this {import('./').PageUtils}
 * @param {string} panelTitle The name of sidebar panel.
 */
export async function openSidebarPanelWithTitle( panelTitle ) {
	const panelSelector = await this.findSidebarPanelWithTitle( panelTitle );

	// Open the panel if it is not already opened.
	const panelSelectorIsOpened = await panelSelector.evaluate( ( element ) =>
		element.classList.contains( 'is-opened' )
	);

	if ( ! panelSelectorIsOpened ) {
		await panelSelector.click();
	}
}
