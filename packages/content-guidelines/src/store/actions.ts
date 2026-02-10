/**
 * Internal dependencies
 */
import type {
	Guidelines,
	CategoryGuideline,
	BlockGuidelines,
	Revision,
	RevisionPagination,
} from './constants';

/**
 * Action Types
 */
export const FETCH_GUIDELINES_START = 'FETCH_GUIDELINES_START' as const;
export const FETCH_GUIDELINES_SUCCESS = 'FETCH_GUIDELINES_SUCCESS' as const;
export const FETCH_GUIDELINES_ERROR = 'FETCH_GUIDELINES_ERROR' as const;
export const SAVE_GUIDELINES_START = 'SAVE_GUIDELINES_START' as const;
export const SAVE_GUIDELINES_SUCCESS = 'SAVE_GUIDELINES_SUCCESS' as const;
export const SAVE_GUIDELINES_ERROR = 'SAVE_GUIDELINES_ERROR' as const;
export const UPDATE_CATEGORY = 'UPDATE_CATEGORY' as const;
export const SET_STATUS = 'SET_STATUS' as const;
export const RESET_CHANGES = 'RESET_CHANGES' as const;
export const FETCH_REVISIONS_START = 'FETCH_REVISIONS_START' as const;
export const FETCH_REVISIONS_SUCCESS = 'FETCH_REVISIONS_SUCCESS' as const;
export const FETCH_REVISIONS_ERROR = 'FETCH_REVISIONS_ERROR' as const;
export const RESTORE_REVISION_START = 'RESTORE_REVISION_START' as const;
export const RESTORE_REVISION_SUCCESS = 'RESTORE_REVISION_SUCCESS' as const;
export const RESTORE_REVISION_ERROR = 'RESTORE_REVISION_ERROR' as const;
export const RESET_STORE = 'RESET_STORE' as const;

/**
 * Action type definitions
 */
export type Action =
	| { type: typeof FETCH_GUIDELINES_START }
	| { type: typeof FETCH_GUIDELINES_SUCCESS; payload: Guidelines | null }
	| { type: typeof FETCH_GUIDELINES_ERROR; payload: string }
	| { type: typeof SAVE_GUIDELINES_START }
	| { type: typeof SAVE_GUIDELINES_SUCCESS; payload: Guidelines }
	| { type: typeof SAVE_GUIDELINES_ERROR; payload: string }
	| {
			type: typeof UPDATE_CATEGORY;
			payload: {
				category: string;
				value: CategoryGuideline | BlockGuidelines;
			};
	  }
	| { type: typeof SET_STATUS; payload: 'draft' | 'published' }
	| { type: typeof RESET_CHANGES }
	| { type: typeof FETCH_REVISIONS_START }
	| {
			type: typeof FETCH_REVISIONS_SUCCESS;
			payload: { revisions: Revision[]; pagination: RevisionPagination };
	  }
	| { type: typeof FETCH_REVISIONS_ERROR; payload: string }
	| { type: typeof RESTORE_REVISION_START; payload: number }
	| { type: typeof RESTORE_REVISION_SUCCESS; payload: Guidelines }
	| { type: typeof RESTORE_REVISION_ERROR; payload: string }
	| { type: typeof RESET_STORE };

export interface ThunkArgs {
	dispatch: {
		( action: Action ): void;
		[ key: string ]: ( ...args: any[] ) => any;
	};
}

/**
 * Fetch guidelines (mock implementation).
 *
 * @return Thunk action.
 */
export const fetchGuidelines =
	() =>
	async ( { dispatch }: ThunkArgs ) => {
		dispatch( { type: FETCH_GUIDELINES_START } );

		try {
			// Simulate network delay.
			await new Promise( ( resolve ) => setTimeout( resolve, 200 ) );

			dispatch( {
				type: FETCH_GUIDELINES_SUCCESS,
				payload: null,
			} );
		} catch ( error ) {
			dispatch( {
				type: FETCH_GUIDELINES_ERROR,
				payload:
					( error as Error ).message || 'Failed to fetch guidelines',
			} );
		}
	};

/**
 * Save guidelines (mock implementation).
 *
 * @param data Guidelines data to save.
 * @return Thunk action.
 */
export const saveGuidelines =
	( data: Guidelines ) =>
	async ( { dispatch }: ThunkArgs ) => {
		dispatch( { type: SAVE_GUIDELINES_START } );

		try {
			// Simulate network delay.
			await new Promise( ( resolve ) => setTimeout( resolve, 200 ) );

			const response = {
				...data,
				id: data.id || 1,
				modified: new Date().toISOString(),
			};

			dispatch( {
				type: SAVE_GUIDELINES_SUCCESS,
				payload: response,
			} );

			return response;
		} catch ( error ) {
			dispatch( {
				type: SAVE_GUIDELINES_ERROR,
				payload:
					( error as Error ).message || 'Failed to save guidelines',
			} );
			throw error;
		}
	};

/**
 * Update a specific category's content.
 *
 * @param category The category slug.
 * @param value    The new value for the category.
 * @return Action object.
 */
export const updateCategory = (
	category: string,
	value: CategoryGuideline | BlockGuidelines
): Action => ( {
	type: UPDATE_CATEGORY,
	payload: { category, value },
} );

/**
 * Set the status of the guidelines.
 *
 * @param status The status ('draft' or 'published').
 * @return Action object.
 */
export const setStatus = ( status: 'draft' | 'published' ): Action => ( {
	type: SET_STATUS,
	payload: status,
} );

/**
 * Reset changes to the original state.
 *
 * @return Action object.
 */
export const resetChanges = (): Action => ( {
	type: RESET_CHANGES,
} );

/**
 * Reset the entire store back to its default state.
 *
 * @return Action object.
 */
export const resetStore = (): Action => ( {
	type: RESET_STORE,
} );

/**
 * Fetch revisions (mock implementation).
 *
 * TODO: Replace with real API call.
 * Revisions are currently tracked in-memory by the reducer
 * on each successful save, so this is a no-op.
 *
 * @return Thunk action.
 */
export const fetchRevisions = () => async () => {};

/**
 * Restore a revision (mock implementation).
 *
 * @param postId     The guidelines post ID.
 * @param revisionId The revision ID to restore.
 * @return Thunk action.
 */
export const restoreRevision =
	( postId: number, revisionId: number ) =>
	async ( { dispatch }: ThunkArgs ) => {
		dispatch( { type: RESTORE_REVISION_START, payload: revisionId } );

		try {
			// Simulate network delay.
			await new Promise( ( resolve ) => setTimeout( resolve, 300 ) );

			// TODO: Replace with real API call to restore revision.
			const response: Guidelines = {
				id: postId,
				status: 'published',
				guideline_categories: {
					copy: { label: 'Copy Guidelines', guidelines: '' },
					images: { label: 'Image Guidelines', guidelines: '' },
					site: { label: 'Site Context', guidelines: '' },
					blocks: {},
					other: { label: 'Other Guidelines', guidelines: '' },
				},
				modified: new Date().toISOString(),
			};

			dispatch( {
				type: RESTORE_REVISION_SUCCESS,
				payload: response,
			} );

			// Refresh revisions after restore.
			dispatch.fetchRevisions();

			return response;
		} catch ( error ) {
			dispatch( {
				type: RESTORE_REVISION_ERROR,
				payload:
					( error as Error ).message || 'Failed to restore revision',
			} );
			throw error;
		}
	};
