/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

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

/**
 * Action type definitions
 */
export type Action =
	| { type: typeof FETCH_GUIDELINES_START }
	| { type: typeof FETCH_GUIDELINES_SUCCESS; payload: Guidelines }
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
	| { type: typeof RESTORE_REVISION_ERROR; payload: string };

export interface ThunkArgs {
	dispatch: ( action: Action ) => void;
}

/**
 * Fetch guidelines from the REST API.
 *
 * @return Thunk action.
 */
export const fetchGuidelines =
	() =>
	async ( { dispatch }: ThunkArgs ) => {
		dispatch( { type: FETCH_GUIDELINES_START } );

		try {
			const response = await apiFetch< Guidelines >( {
				path: '/__experimental/content-guidelines',
			} );

			dispatch( {
				type: FETCH_GUIDELINES_SUCCESS,
				payload: response,
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
 * Save guidelines to the REST API.
 *
 * @param data Guidelines data to save.
 * @return Thunk action.
 */
export const saveGuidelines =
	( data: Guidelines ) =>
	async ( { dispatch }: ThunkArgs ) => {
		dispatch( { type: SAVE_GUIDELINES_START } );

		try {
			const method = data.id ? 'PATCH' : 'POST';
			const path = data.id
				? `/__experimental/content-guidelines/${ data.id }`
				: '/__experimental/content-guidelines';

			const response = await apiFetch< Guidelines >( {
				path,
				method,
				data: {
					status: data.status,
					guideline_categories: data.guideline_categories,
				},
			} );

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
 * Fetch revisions for a guidelines post.
 *
 * @param postId  The guidelines post ID.
 * @param page    The page number (default: 1).
 * @param perPage Number of revisions per page (default: 5).
 * @return Thunk action.
 */
export const fetchRevisions =
	( postId: number, page: number = 1, perPage: number = 5 ) =>
	async ( { dispatch }: ThunkArgs ) => {
		dispatch( { type: FETCH_REVISIONS_START } );

		try {
			const response = ( await apiFetch( {
				path: `/__experimental/content-guidelines/${ postId }/revisions?page=${ page }&per_page=${ perPage }`,
				parse: false,
			} ) ) as Response;

			const revisions = ( await response.json() ) as Revision[];
			const totalItems = parseInt(
				response.headers.get( 'X-WP-Total' ) || '0',
				10
			);
			const totalPages = parseInt(
				response.headers.get( 'X-WP-TotalPages' ) || '1',
				10
			);

			dispatch( {
				type: FETCH_REVISIONS_SUCCESS,
				payload: {
					revisions,
					pagination: {
						currentPage: page,
						totalPages,
						totalItems,
						perPage,
					},
				},
			} );
		} catch ( error ) {
			dispatch( {
				type: FETCH_REVISIONS_ERROR,
				payload:
					( error as Error ).message || 'Failed to fetch revisions',
			} );
		}
	};

/**
 * Restore a revision to the main guidelines post.
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
			const response = await apiFetch< Guidelines >( {
				path: `/__experimental/content-guidelines/${ postId }/revisions/${ revisionId }/restore`,
				method: 'POST',
			} );

			dispatch( {
				type: RESTORE_REVISION_SUCCESS,
				payload: response,
			} );

			// Refresh revisions after restore.
			dispatch( fetchRevisions( postId ) as unknown as Action );

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
