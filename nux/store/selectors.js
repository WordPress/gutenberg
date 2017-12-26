/**
 * Returns whether the tip has already been shown
 *
 * @param  {Object}  state Global application state
 * @param  {String}  tipId The tip ID
 * @return {Boolean}       Whether the tip has been shown or not
 */
export function tipHasBeenShown( state, tipId ) {
	return state.nux.tips[ tipId ];
}
