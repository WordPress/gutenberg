/**
 * Deprecated NUX store state kept only so the core/nux store can still be
 * registered for backward compatibility.
 */
const DEFAULT_STATE = {
	guides: [],
	preferences: {
		areTipsEnabled: false,
		dismissedTips: {},
	},
};

/**
 * Reducer that preserves state without responding to actions.
 *
 * @param {Object} state Current state.
 *
 * @return {Object} Current state.
 */
export default function reducer( state = DEFAULT_STATE ) {
	return state;
}
