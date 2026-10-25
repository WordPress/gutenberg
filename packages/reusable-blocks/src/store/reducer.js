/**
 * Deprecated reusable blocks store state kept only so the
 * `core/reusable-blocks` store can still be registered for backward
 * compatibility.
 */
const DEFAULT_STATE = {
	isEditingReusableBlock: {},
};

/**
 * Reducer that preserves the default state without responding to actions.
 *
 * @param {Object} state Current state.
 *
 * @return {Object} Current state.
 */
export default function reducer( state = DEFAULT_STATE ) {
	return state;
}
