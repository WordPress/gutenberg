/**
 * Returns the current editing mode.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Editing mode.
 */
export function getEditorMode( state ) {
	return getPreference( state, 'mode', 'visual' );
}

/**
 * Returns the current active panel for the sidebar.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Active sidebar panel.
 */
export function getActivePanel( state ) {
	return state.panel;
}

/**
 * Returns the preferences (these preferences are persisted locally).
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Preferences Object.
 */
export function getPreferences( state ) {
	return state.preferences;
}

/**
 *
 * @param {Object} state         Global application state.
 * @param {string} preferenceKey Preference Key.
 * @param {Mixed}  defaultValue  Default Value.
 *
 * @return {Mixed} Preference Value.
 */
export function getPreference( state, preferenceKey, defaultValue ) {
	const preferences = getPreferences( state );
	const value = preferences[ preferenceKey ];
	return value === undefined ? defaultValue : value;
}

/**
 * Returns true if the sidebar is open, or false otherwise.
 *
 * @param {Object} state   Global application state.
 * @param {string} sidebar Sidebar name (leave undefined for the default sidebar).
 *
 * @return {boolean} Whether the given sidebar is open.
 */
export function isSidebarOpened( state, sidebar ) {
	const sidebars = getPreference( state, 'sidebars' );
	if ( sidebar !== undefined ) {
		return sidebars[ sidebar ];
	}

	return isMobile( state ) ? sidebars.mobile : sidebars.desktop;
}

/**
 * Returns true if there's any open sidebar (mobile, desktop or publish).
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether sidebar is open.
 */
export function hasOpenSidebar( state ) {
	const sidebars = getPreference( state, 'sidebars' );
	return isMobile( state ) ?
		sidebars.mobile || sidebars.publish :
		sidebars.desktop || sidebars.publish;
}

/**
 * Returns true if the editor sidebar panel is open, or false otherwise.
 *
 * @param {Object} state Global application state.
 * @param {string} panel Sidebar panel name.
 *
 * @return {boolean} Whether sidebar is open.
 */
export function isEditorSidebarPanelOpened( state, panel ) {
	const panels = getPreference( state, 'panels' );
	return panels ? !! panels[ panel ] : false;
}

/**
 * Returns true if the current window size corresponds to mobile resolutions (<= medium breakpoint).
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether current window size corresponds to
 *                    mobile resolutions.
 */
export function isMobile( state ) {
	return state.mobile;
}

/**
 * Returns whether the toolbar should be fixed or not.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if toolbar is fixed.
 */
export function hasFixedToolbar( state ) {
	return ! isMobile( state ) && isFeatureActive( state, 'fixedToolbar' );
}

/**
 * Returns whether the given feature is enabled or not.
 *
 * @param {Object} state   Global application state.
 * @param {string} feature Feature slug.
 *
 * @return {booleean} Is active.
 */
export function isFeatureActive( state, feature ) {
	return !! state.preferences.features[ feature ];
}
