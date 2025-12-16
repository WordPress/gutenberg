/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useBlockEditingMode } from '@wordpress/block-editor';

/**
 * Custom hook to check if a navigation link points to an invalid or deleted entity.
 *
 * Checks if a post-type link is:
 * - Deleted (entity no longer exists)
 * - Trashed (post status is 'trash')
 * - Draft (post status is 'draft')
 *
 * This check is skipped when:
 * - The block editing mode is 'disabled' (e.g., in templates)
 * - The `enabled` parameter is false
 * - The link is not a post-type link
 *
 * @param {string}  kind    The kind of entity (e.g., 'post-type', 'taxonomy').
 * @param {string}  type    The entity type (e.g., 'post', 'page').
 * @param {number}  id      The entity ID.
 * @param {boolean} enabled Whether to perform the validation check.
 * @return {Array} A tuple of [isInvalid, isDraft] booleans.
 */
export function useIsInvalidLink( kind, type, id, enabled ) {
	const isPostType =
		kind === 'post-type' || type === 'post' || type === 'page';
	const hasId = Number.isInteger( id );
	const blockEditingMode = useBlockEditingMode();

	const { postStatus, isDeleted } = useSelect(
		( select ) => {
			if ( ! isPostType ) {
				return { postStatus: null, isDeleted: false };
			}

			// Fetching the posts status is an "expensive" operation. Especially for sites with large navigations.
			// When the block is rendered in a template or other disabled contexts we can skip this check in order
			// to avoid all these additional requests that don't really add any value in that mode.
			if ( blockEditingMode === 'disabled' || ! enabled ) {
				return { postStatus: null, isDeleted: false };
			}

			const { getEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const entityRecord = getEntityRecord( 'postType', type, id );
			const hasResolved = hasFinishedResolution( 'getEntityRecord', [
				'postType',
				type,
				id,
			] );

			// If resolution has finished and entityRecord is undefined, the entity was deleted.
			const deleted = hasResolved && entityRecord === undefined;

			return {
				postStatus: entityRecord?.status,
				isDeleted: deleted,
			};
		},
		[ isPostType, blockEditingMode, enabled, type, id ]
	);

	// Check Navigation Link validity if:
	// 1. Link is 'post-type'.
	// 2. It has an id.
	// 3. It's neither null, nor undefined, as valid items might be either of those while loading.
	// If those conditions are met, check if
	// 1. The post status is trash (trashed).
	// 2. The entity doesn't exist (deleted).
	// If either of those is true, invalidate.
	const isInvalid =
		isPostType &&
		hasId &&
		( isDeleted || ( postStatus && 'trash' === postStatus ) );
	const isDraft = 'draft' === postStatus;

	return [ isInvalid, isDraft ];
}
