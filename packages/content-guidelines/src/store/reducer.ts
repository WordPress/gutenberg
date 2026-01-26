/**
 * Internal dependencies
 */
import {
	FETCH_GUIDELINES_START,
	FETCH_GUIDELINES_SUCCESS,
	FETCH_GUIDELINES_ERROR,
	SAVE_GUIDELINES_START,
	SAVE_GUIDELINES_SUCCESS,
	SAVE_GUIDELINES_ERROR,
	UPDATE_CATEGORY,
	SET_STATUS,
	RESET_CHANGES,
} from './actions';
import type { Action } from './actions';
import { DEFAULT_STATE, DEFAULT_CATEGORIES } from './constants';
import type { State, Guidelines } from './constants';

/**
 * Reducer for the content guidelines store.
 *
 * @param state  Current state.
 * @param action Action object.
 * @return Updated state.
 */
export default function reducer(
	state: State = DEFAULT_STATE,
	action: Action
): State {
	switch ( action.type ) {
		case FETCH_GUIDELINES_START:
			return {
				...state,
				isLoading: true,
				error: null,
			};

		case FETCH_GUIDELINES_SUCCESS: {
			const guidelines: Guidelines = {
				...action.payload,
				guideline_categories: {
					...DEFAULT_CATEGORIES,
					...( action.payload.guideline_categories || {} ),
				},
			};
			return {
				...state,
				guidelines,
				originalGuidelines: JSON.parse( JSON.stringify( guidelines ) ),
				isLoading: false,
				error: null,
			};
		}

		case FETCH_GUIDELINES_ERROR:
			return {
				...state,
				isLoading: false,
				error: action.payload,
			};

		case SAVE_GUIDELINES_START:
			return {
				...state,
				isSaving: true,
				error: null,
			};

		case SAVE_GUIDELINES_SUCCESS: {
			const guidelines: Guidelines = {
				...action.payload,
				guideline_categories: {
					...DEFAULT_CATEGORIES,
					...( action.payload.guideline_categories || {} ),
				},
			};
			return {
				...state,
				guidelines,
				originalGuidelines: JSON.parse( JSON.stringify( guidelines ) ),
				isSaving: false,
				error: null,
			};
		}

		case SAVE_GUIDELINES_ERROR:
			return {
				...state,
				isSaving: false,
				error: action.payload,
			};

		case UPDATE_CATEGORY: {
			const { category, value } = action.payload;
			return {
				...state,
				guidelines: state.guidelines
					? {
							...state.guidelines,
							guideline_categories: {
								...state.guidelines.guideline_categories,
								[ category ]: value,
							},
					  }
					: null,
			};
		}

		case SET_STATUS:
			return {
				...state,
				guidelines: state.guidelines
					? {
							...state.guidelines,
							status: action.payload,
					  }
					: null,
			};

		case RESET_CHANGES:
			return {
				...state,
				guidelines: state.originalGuidelines
					? JSON.parse( JSON.stringify( state.originalGuidelines ) )
					: null,
			};

		default:
			return state;
	}
}
