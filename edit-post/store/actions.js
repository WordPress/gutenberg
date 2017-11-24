
/**
 * Returns an action object used in signalling that the user toggled the sidebar
 *
 * @return {Object}         Action object
 */
export function toggleSidebar() {
	return {
		type: 'TOGGLE_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user switched the active sidebar tab panel
 *
 * @param  {String} panel   The panel name
 * @return {Object}         Action object
 */
export function setActivePanel( panel ) {
	return {
		type: 'SET_ACTIVE_PANEL',
		panel,
	};
}

/**
 * Returns an action object used in signalling that the user toggled a sidebar panel
 *
 * @param  {String} panel   The panel name
 * @return {Object}         Action object
 */
export function toggleSidebarPanel( panel ) {
	return {
		type: 'TOGGLE_SIDEBAR_PANEL',
		panel,
	};
}

/**
 * Returns an action object used to toggle a feature flag
 *
 * @param {String}  feature   Featurre name.
 *
 * @return {Object}           Action object
 */
export function toggleFeature( feature ) {
	return {
		type: 'TOGGLE_FEATURE',
		feature,
	};
}
