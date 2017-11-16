/**
 * Reducer
 */

/**
 * Reducer returning active panel, containing keys of block UID whose values
 * reflect whether the block is being edited as visual or HTML.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export default function blocksMode( state = {}, action ) {
	if ( action.type === 'TOGGLE_BLOCK_MODE' ) {
		const { uid } = action;
		return {
			...state,
			[ uid ]: state[ uid ] && state[ uid ] === 'html' ? 'visual' : 'html',
		};
	}

	return state;
}

/**
 * Action creators
 */

/**
 * Returns an action object used to toggle the block editing mode (visual/html)
 *
 * @param  {String} uid Block UID
 * @return {Object}     Action object
 */
export function toggleBlockMode( uid ) {
	return {
		type: 'TOGGLE_BLOCK_MODE',
		uid,
	};
}

/**
 * Selectors
 */

/**
 * Returns thee block's editing mode
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Block editing mode
 */
export function getBlockMode( state, uid ) {
	return state.blocksMode[ uid ] || 'visual';
}
