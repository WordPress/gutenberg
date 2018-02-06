
/**
 * Returns an action object used in signalling that the user toggled the
 * sidebar.
 *
 * @param {string}   sidebar     Name of the sidebar to toggle
 *                               (desktop, mobile or publish).
 * @param {boolean?} forcedValue Force a sidebar state.
 *
 * @return {Object} Action object.
 */
export function toggleSidebar( sidebar, forcedValue ) {
	return {
		type: 'TOGGLE_SIDEBAR',
		sidebar,
		forcedValue,
	};
}

/**
 * Returns an action object used in signalling that the user switched the active
 * sidebar tab panel.
 *
 * @param {string} panel The panel name.
 *
 * @return {Object} Action object.
 */
export function setActivePanel( panel ) {
	return {
		type: 'SET_ACTIVE_PANEL',
		panel,
	};
}

/**
 * Returns an action object used in signalling that the user toggled a
 * sidebar panel.
 *
 * @param {string} panel The panel name.
 *
 * @return {Object} Action object.
 */
export function toggleSidebarPanel( panel ) {
	return {
		type: 'TOGGLE_SIDEBAR_PANEL',
		panel,
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
