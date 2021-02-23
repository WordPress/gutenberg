/**
 * Internal dependencies
 */
import { findSidebarPanelToggleButtonWithTitle } from './find-sidebar-panel-toggle-button-with-title';

/**
 * Opens a sidebar panel with the provided title.
 *
 * @param {string} panelTitle The name of sidebar panel.
 */
export async function openSidebarPanel( panelTitle ) {
	const panelToggle = await findSidebarPanelToggleButtonWithTitle(
		panelTitle
	);
	const panelIsCollapsed = await panelToggle.evaluate(
		( node ) => node.getAttribute( 'aria-expanded' ) === 'false'
	);
	if ( panelIsCollapsed ) {
		await panelToggle.click();
	}
}
