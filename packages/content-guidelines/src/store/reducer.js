/**
 * Internal dependencies
 */
import {
	SET_ERROR,
	SET_REVISIONS,
	SET_RESTORING,
	SET_TEST_RESULTS,
	SET_RUNNING_TEST,
} from './actions';

/**
 * Default state.
 * Only UI-only state is managed here.
 * Guidelines data is managed by core-data.
 */
const DEFAULT_STATE = {
	error: null,
	revisions: [],
	isRestoring: false,
	testResults: null,
	isRunningTest: false,
};

/**
 * Reducer for UI-only state.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Action object.
 * @return {Object} New state.
 */
export default function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case SET_ERROR:
			return {
				...state,
				error: action.payload,
			};

		case SET_REVISIONS:
			return {
				...state,
				revisions: action.payload,
			};

		case SET_RESTORING:
			return {
				...state,
				isRestoring: action.payload,
			};

		case SET_TEST_RESULTS:
			return {
				...state,
				testResults: action.payload,
			};

		case SET_RUNNING_TEST:
			return {
				...state,
				isRunningTest: action.payload,
			};

		default:
			return state;
	}
}
