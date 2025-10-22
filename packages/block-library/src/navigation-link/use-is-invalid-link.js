/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useBlockEditingMode } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Hook to determine if a navigation link is invalid or draft.
 *
 * @param {string}  kind    The kind of entity (post-type, taxonomy, custom, etc.)
 * @param {string}  type    The type of entity (post, page, category, tag, etc.)
 * @param {number}  id      The entity ID
 * @param {boolean} enabled Whether validation is enabled
 * @return {[boolean, boolean]} [isInvalid, isDraft]
 */
export const useIsInvalidLink = ( kind, type, id, enabled ) => {
	const isPostType = kind === 'post-type';
	const isTaxonomy = kind === 'taxonomy';
	const hasId = Number.isInteger( id );
	const blockEditingMode = useBlockEditingMode();

	const entityData = useSelect(
		( select ) => {
			// Early exit if no valid ID
			if ( ! hasId ) {
				return null;
			}

			// Early exit if validation is disabled or block editing mode is disabled
			if ( ! enabled || blockEditingMode === 'disabled' ) {
				return null;
			}

			// Early exit for non-entity links (custom, post-type-archive, etc.)
			if ( ! isPostType && ! isTaxonomy ) {
				return null;
			}

			const { getEntityRecord } = select( coreStore );

			if ( isPostType ) {
				return getEntityRecord( 'postType', type, id );
			}

			if ( isTaxonomy ) {
				return getEntityRecord( 'taxonomy', type, id );
			}

			return null;
		},
		[ isPostType, isTaxonomy, type, id, hasId, enabled, blockEditingMode ]
	);

	// Early exit if no valid ID
	if ( ! hasId ) {
		return [ false, false ];
	}

	// Early exit if validation is disabled or block editing mode is disabled
	if ( ! enabled || blockEditingMode === 'disabled' ) {
		return [ false, false ];
	}

	// Early exit for non-entity links (custom, post-type-archive, etc.)
	if ( ! isPostType && ! isTaxonomy ) {
		return [ false, false ];
	}

	// For post types, check status
	if ( isPostType ) {
		const status = entityData?.status;
		const isInvalid = status === 'trash';
		const isDraft = status === 'draft';
		return [ isInvalid, isDraft ];
	}

	// For taxonomies, check if entity exists
	if ( isTaxonomy ) {
		const isInvalid = ! entityData; // null/undefined means invalid
		const isDraft = false; // taxonomies don't have draft status
		return [ isInvalid, isDraft ];
	}

	// Fallback
	return [ false, false ];
};
