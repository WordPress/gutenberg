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
	FETCH_REVISIONS_START,
	FETCH_REVISIONS_SUCCESS,
	FETCH_REVISIONS_ERROR,
	RESTORE_REVISION_START,
	RESTORE_REVISION_SUCCESS,
	RESTORE_REVISION_ERROR,
} from './actions';
import type { Action } from './actions';
import { DEFAULT_STATE, DEFAULT_CATEGORIES } from './constants';
import type { State, Guidelines } from './constants';

/**
 * Normalizes guidelines payload by merging with default categories.
 *
 * @param payload Raw guidelines from API response.
 * @return Normalized guidelines with default categories applied.
 */
function normalizeGuidelines( payload: Guidelines ): Guidelines {
	return {
		...payload,
		guideline_categories: {
			...DEFAULT_CATEGORIES,
			...( payload.guideline_categories || {} ),
		},
	};
}

/**
 * Creates a deep clone of an object using JSON serialization.
 *
 * @param obj Object to clone.
 * @return Deep cloned object.
 */
function deepClone< T >( obj: T ): T {
	return JSON.parse( JSON.stringify( obj ) );
}

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
			const guidelines = normalizeGuidelines( action.payload );
			return {
				...state,
				guidelines,
				originalGuidelines: deepClone( guidelines ),
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
			const guidelines = normalizeGuidelines( action.payload );
			return {
				...state,
				guidelines,
				originalGuidelines: deepClone( guidelines ),
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
			if ( ! state.guidelines ) {
				return state;
			}
			const { category, value } = action.payload;
			return {
				...state,
				guidelines: {
					...state.guidelines,
					guideline_categories: {
						...state.guidelines.guideline_categories,
						[ category ]: value,
					},
				},
			};
		}

		case SET_STATUS:
			if ( ! state.guidelines ) {
				return state;
			}
			return {
				...state,
				guidelines: {
					...state.guidelines,
					status: action.payload,
				},
			};

		case RESET_CHANGES:
			return {
				...state,
				guidelines: state.originalGuidelines
					? deepClone( state.originalGuidelines )
					: null,
			};

		case FETCH_REVISIONS_START:
			return {
				...state,
				isLoadingRevisions: true,
			};

		case FETCH_REVISIONS_SUCCESS:
			return {
				...state,
				revisions: action.payload.revisions,
				revisionPagination: action.payload.pagination,
				isLoadingRevisions: false,
			};

		case FETCH_REVISIONS_ERROR:
			return {
				...state,
				isLoadingRevisions: false,
				error: action.payload,
			};

		case RESTORE_REVISION_START:
			return {
				...state,
				isRestoring: action.payload,
			};

		case RESTORE_REVISION_SUCCESS: {
			const guidelines = normalizeGuidelines( action.payload );
			return {
				...state,
				guidelines,
				originalGuidelines: deepClone( guidelines ),
				isRestoring: null,
			};
		}

		case RESTORE_REVISION_ERROR:
			return {
				...state,
				isRestoring: null,
				error: action.payload,
			};

		default:
			return state;
	}
}
