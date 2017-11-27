/**
 * Returns the preferences (these preferences are persisted locally)
 *
 * @param  {Object}  state Global application state
 * @return {Object}        Preferences Object
 */
export function getPreferences( state ) {
	return state.preferences;
}

/**
 *
 * @param  {Object}  state          Global application state
 * @param  {String}  preferenceKey  Preference Key
 * @param  {Mixed}   defaultValue   Default Value
 * @return {Mixed}                  Preference Value
 */
export function getPreference( state, preferenceKey, defaultValue ) {
	const preferences = getPreferences( state );
	const value = preferences[ preferenceKey ];
	return value === undefined ? defaultValue : value;
}

/**
 * Returns true if the editor sidebar is open, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether sidebar is open
 */
export function isEditorSidebarOpened( state ) {
	return getPreference( state, 'isSidebarOpened' );
}

/**
 * Returns true if the editor sidebar panel is open, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {STring}  panel Sidebar panel name
 * @return {Boolean}       Whether sidebar is open
 */
export function isEditorSidebarPanelOpened( state, panel ) {
	const panels = getPreference( state, 'panels' );
	return panels ? !! panels[ panel ] : false;
}

/**
 * Returns the current editing mode.
 *
 * @param  {Object} state Global application state
 * @return {String}       Editing mode
 */
export function getEditorMode( state ) {
	return getPreference( state, 'mode', 'visual' );
}

/**
 * Returns whether the given feature is enabled or not
 *
 * @param {Object}    state   Global application state
 * @param {String}    feature Feature slug
 * @return {Booleean}         Is active
 */
export function isFeatureActive( state, feature ) {
	return !! state.preferences.features[ feature ];
}

/**
 * Returns the current active panel for the sidebar.
 *
 * @param  {Object}  state Global application state
 * @return {String}        Active sidebar panel
 */
export function getActivePanel( state ) {
	return state.panel;
}
