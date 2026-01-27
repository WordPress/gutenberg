/**
 * Internal dependencies
 */
import type {
	State,
	Guidelines,
	CategoryGuideline,
	BlockGuidelines,
	Revision,
	RevisionPagination,
} from './constants';

/**
 * Get the full guidelines object.
 *
 * @param state Store state.
 * @return Guidelines object or null.
 */
export const getGuidelines = ( state: State ): Guidelines | null =>
	state.guidelines;

/**
 * Get a specific category from the guidelines.
 *
 * @param state    Store state.
 * @param category Category slug.
 * @return Category data or null.
 */
export const getCategory = (
	state: State,
	category: string
): CategoryGuideline | BlockGuidelines | null => {
	if ( ! state.guidelines?.guideline_categories ) {
		return null;
	}
	return (
		state.guidelines.guideline_categories[
			category as keyof typeof state.guidelines.guideline_categories
		] || null
	);
};

/**
 * Get the current status of the guidelines.
 *
 * @param state Store state.
 * @return Status ('draft' or 'published').
 */
export const getStatus = ( state: State ): 'draft' | 'published' =>
	state.guidelines?.status || 'draft';

/**
 * Check if there are unsaved changes.
 *
 * @param state Store state.
 * @return True if there are unsaved changes.
 */
export const isDirty = ( state: State ): boolean => {
	if ( ! state.guidelines || ! state.originalGuidelines ) {
		return false;
	}
	return (
		JSON.stringify( state.guidelines ) !==
		JSON.stringify( state.originalGuidelines )
	);
};

/**
 * Check if guidelines are currently being loaded.
 *
 * @param state Store state.
 * @return True if loading.
 */
export const isLoading = ( state: State ): boolean => state.isLoading;

/**
 * Check if guidelines are currently being saved.
 *
 * @param state Store state.
 * @return True if saving.
 */
export const isSaving = ( state: State ): boolean => state.isSaving;

/**
 * Get any error message.
 *
 * @param state Store state.
 * @return Error message or null.
 */
export const getError = ( state: State ): string | null => state.error;

/**
 * Get the list of revisions.
 *
 * @param state Store state.
 * @return Array of revisions.
 */
export const getRevisions = ( state: State ): Revision[] => state.revisions;

/**
 * Check if revisions are currently being loaded.
 *
 * @param state Store state.
 * @return True if loading revisions.
 */
export const isLoadingRevisions = ( state: State ): boolean =>
	state.isLoadingRevisions;

/**
 * Get the ID of the revision currently being restored, if any.
 *
 * @param state Store state.
 * @return Revision ID being restored or null.
 */
export const getRestoringRevisionId = ( state: State ): number | null =>
	state.isRestoring;

/**
 * Get the revision pagination state.
 *
 * @param state Store state.
 * @return Pagination state object.
 */
export const getRevisionPagination = ( state: State ): RevisionPagination =>
	state.revisionPagination;
