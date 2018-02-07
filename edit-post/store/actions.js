
/**
 * Returns an action object used in signalling that the user switched the active
 * sidebar tab panel.
 *
 * @param  {string} sidebar Sidebar name
 * @param  {string} panel   Panel name
 * @return {Object}         Action object
 */
export function setGeneralSidebarActivePanel( sidebar, panel ) {
	return {
		type: 'SET_GENERAL_SIDEBAR_ACTIVE_PANEL',
		sidebar,
		panel,
	};
}

/**
 * Returns an action object used in signalling that the user opened a sidebar.
 *
 * @param {string} sidebar        Sidebar to open.
 * @param {string} [panel = null] Panel to open in the sidebar. Null if unchanged.
 * @return {Object}              Action object.
 */
export function openGeneralSidebar( sidebar, panel = null ) {
	return {
		type: 'OPEN_GENERAL_SIDEBAR',
		sidebar,
		panel,
	};
}

/**
 * Returns an action object signalling that the user closed the sidebar.
 *
 * @return {Object} Action object.
 */
export function closeGeneralSidebar() {
	return {
		type: 'CLOSE_GENERAL_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user opened the publish
 * sidebar.
 *
 * @return {Object} Action object
 */
export function openPublishSidebar() {
	return {
		type: 'OPEN_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user closed the
 * publish sidebar.
 *
 * @return {Object} Action object.
 */
export function closePublishSidebar() {
	return {
		type: 'CLOSE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user toggles the publish sidebar
 *
 * @return {Object} Action object
 */
export function togglePublishSidebar() {
	return {
		type: 'TOGGLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that use toggled a panel in the editor.
 *
 * @param {string}  panel The panel to toggle.
 * @return {Object} Action object.
*/
export function toggleGeneralSidebarEditorPanel( panel ) {
	return {
		type: 'TOGGLE_GENERAL_SIDEBAR_EDITOR_PANEL',
		panel,
	};
}

/**
 * Returns an action object used in signalling that the viewport type preference should be set.
 *
 * @param {string} viewportType The viewport type (desktop or mobile).
 * @return {Object} Action object.
 */
export function setViewportType( viewportType ) {
	return {
		type: 'SET_VIEWPORT_TYPE',
		viewportType,
	};
}

/**
 * Returns an action object used to toggle a feature flag.
 *
 * @param {string} feature Featurre name.
 *
 * @return {Object} Action object.
 */
export function toggleFeature( feature ) {
	return {
		type: 'TOGGLE_FEATURE',
		feature,
	};
}

export function switchEditorMode( mode ) {
	return {
		type: 'SWITCH_MODE',
		mode,
	};
}
