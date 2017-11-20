/**
 * Reducer
 */

/**
 * Reducer returning active panel, reflecting whether the user is editing
 * document or block-specific settings.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export default function( state = 'document', action ) {
	switch ( action.type ) {
		case 'SET_ACTIVE_PANEL':
			return action.panel;
	}

	return state;
}

/**
 * Action creators
 */

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
 * Selectors
 */

/**
 * Returns the current active panel for the sidebar.
 *
 * @param  {Object}  state Global application state
 * @return {String}        Active sidebar panel
 */
export function getActivePanel( state ) {
	return state.panel;
}
