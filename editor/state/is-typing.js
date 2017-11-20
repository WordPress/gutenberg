/**
 * Reducer
 */

/**
 * Reducer returning typing state.
 *
 * @param  {Boolean} state  Current state
 * @param  {Object}  action Dispatched action
 * @return {Boolean}        Updated state
 */
export default function( state = false, action ) {
	switch ( action.type ) {
		case 'START_TYPING':
			return true;

		case 'STOP_TYPING':
			return false;
	}

	return state;
}

/**
 * Action creators
 */

/**
 * Returns an action object used in signalling that the user has begun to type.
 *
 * @return {Object}     Action object
 */
export function startTyping() {
	return {
		type: 'START_TYPING',
	};
}

/**
 * Returns an action object used in signalling that the user has stopped typing.
 *
 * @return {Object}     Action object
 */
export function stopTyping() {
	return {
		type: 'STOP_TYPING',
	};
}

/**
 * Selectors
 */

/**
 * Returns true if the user is typing, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether user is typing
 */
export function isTyping( state ) {
	return state.isTyping;
}
