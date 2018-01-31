/**
 * Returns the current editing mode.
 *
 * @param {Object} state Global application state.
 *
 * @returns {string} Editing mode.
 */
export function getEditorMode( state ) {
	return getPreference( state, 'editorMode', 'visual' );
}

/**
 * Returns the current active panel for the sidebar.
 *
 * @param {Object} state Global application state.
 *
 * @returns {string} Active sidebar panel.
 */
export function getActiveEditorPanel( state ) {
	return getPreference( state, 'activeSidebarPanel', {} ).editor;
}

/**
 * Returns the current active plugin for the plugin sidebar.
 *
 * @param  {Object}  state Global application state
 * @return {String}        Active plugin sidebar plugin
 */
export function getActivePlugin( state ) {
	return getPreference( state, 'activeSidebarPanel', {} ).plugins;
}

/**
 * Returns the preferences (these preferences are persisted locally).
 *
 * @param {Object} state Global application state.
 *
 * @returns {Object} Preferences Object.
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
 * @returns {Mixed} Preference Value.
 */
export function getPreference( state, preferenceKey, defaultValue ) {
	const preferences = getPreferences( state );
	const value = preferences[ preferenceKey ];
	return value === undefined ? defaultValue : value;
}

/**
 * Returns the opened general sidebar and null if the sidebar is closed.
 *
 * @param {Object} state Global application state.
 * @returns {String}     The opened general sidebar panel.
 */
export function getOpenedGeneralSidebar( state ) {
	return getPreference( state, 'activeGeneralSidebar' );
}

/**
 * Returns true if the panel is open in the currently opened sidebar.
 *
 * @param  {Object}  state   Global application state
 * @param  {string}  sidebar Sidebar name (leave undefined for the default sidebar)
 * @param  {string}  panel   Sidebar panel name (leave undefined for the default panel)
 * @returns {Boolean}        Whether the given general sidebar panel is open
 */
export function isGeneralSidebarPanelOpened( state, sidebar, panel ) {
	const activeGeneralSidebar = getPreference( state, 'activeGeneralSidebar' );
	const activeSidebarPanel = getPreference( state, 'activeSidebarPanel' );
	return activeGeneralSidebar === sidebar && activeSidebarPanel === panel;
}

/**
 * Returns true if the publish sidebar is opened.
 *
 * @param {Object} state Global application state
 * @returns {bool}       Whether the publish sidebar is open.
 */
export function isPublishSidebarOpened( state ) {
	return state.publishSidebarActive;
}

/**
 * Returns true if there's any open sidebar (mobile, desktop or publish).
 *
 * @param {Object} state Global application state.
 *
 * @returns {boolean} Whether sidebar is open.
 */
export function hasOpenSidebar( state ) {
	const generalSidebarOpen = getPreference( state, 'activeGeneralSidebar' ) !== null;
	const publishSidebarOpen = state.publishSidebarActive;

	return generalSidebarOpen || publishSidebarOpen;
}

/**
 * Returns true if the editor sidebar panel is open, or false otherwise.
 *
 * @param  {Object}  state Global application state.
 * @param  {String}  panel Sidebar panel name.
 * @returns {Boolean}       Whether sidebar is open.
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
 * @returns {boolean} Whether current window size corresponds to
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
 * @returns {boolean} True if toolbar is fixed.
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
 * @returns {boolean} Is active.
 */
export function isFeatureActive( state, feature ) {
	return !! state.preferences.features[ feature ];
}
