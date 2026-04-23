/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useBlockEditingMode, isURLLike } from '@wordpress/block-editor';

/**
 * A React hook to determine if a navigation link or submenu's parent link is invalid.
 *
 * @param {string}  kind             The kind of link (post-type, custom, taxonomy, etc).
 * @param {string}  type             The type of post (post, page, etc).
 * @param {number}  id               The post or term id.
 * @param {boolean} enabled          Whether to enable the entity validation check.
 * @param {string}  url              The URL attribute (for custom link validation).
 * @param {boolean} isEditingContext Whether the block (or parent block) is selected.
 * @return {Array} Array containing [isInvalid, isDraft] booleans.
 */
export const useIsInvalidLink = (
	kind,
	type,
	id,
	enabled,
	url,
	isEditingContext
) => {
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
	const isInvalidEntity =
		isPostType &&
		hasId &&
		( isDeleted || ( postStatus && 'trash' === postStatus ) );
	const isDraft = 'draft' === postStatus;

	// URL-based invalidity check for custom links.
	//
	// A custom link is any link that is NOT a post-type entity binding.
	// We check it when:
	//   1. It is not a post-type link (kind !== 'post-type').
	//   2. The block is in an editable mode (not disabled/template context).
	const shouldCheckUrl =
		! isPostType && blockEditingMode !== 'disabled' && isEditingContext;

	// A custom link is invalid when:
	//   - It has no URL at all, OR
	//   - Its URL fails isURL() (e.g. "not a url")
	const isInvalidUrl = shouldCheckUrl && ( ! url || ! isURLLike( url ) );

	return [ isInvalidEntity || isInvalidUrl, isDraft ];
};
