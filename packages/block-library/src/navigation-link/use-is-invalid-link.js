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

	const { entityData, hasResolved } = useSelect(
		( select ) => {
			// Early exit if validation is disabled
			// Fetching entity records is an "expensive" operation. Especially for sites with large navigations.
			// When the block is rendered in a template or other disabled contexts we can skip this check in order
			// to avoid all these additional requests that don't really add any value in that mode.
			if ( ! enabled ) {
				return { entityData: null, hasResolved: true };
			}

			// Early exit if no valid ID
			if ( ! hasId ) {
				return { entityData: null, hasResolved: true };
			}

			// Early exit if block editing mode is disabled
			if ( blockEditingMode === 'disabled' ) {
				return { entityData: null, hasResolved: true };
			}

			// Early exit for non-entity links (custom, post-type-archive, etc.)
			if ( ! isPostType && ! isTaxonomy ) {
				return { entityData: null, hasResolved: true };
			}

			const { getEntityRecord, hasFinishedResolution } =
				select( coreStore );

			let _entityData = null;
			let _hasResolved = true;

			if ( isPostType ) {
				_entityData = getEntityRecord( 'postType', type, id );
				_hasResolved = hasFinishedResolution( 'getEntityRecord', [
					'postType',
					type,
					id,
				] );
			}

			if ( isTaxonomy ) {
				_entityData = getEntityRecord( 'taxonomy', type, id );
				_hasResolved = hasFinishedResolution( 'getEntityRecord', [
					'taxonomy',
					type,
					id,
				] );
			}

			return { entityData: _entityData, hasResolved: _hasResolved };
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

	// If still loading, don't mark as invalid to avoid false negatives
	if ( ! hasResolved ) {
		return [ false, false ];
	}

	// For post types, check status. The post might technically exist
	// but the link is invalid if it's in the trash or if the entity doesn't exist.
	if ( isPostType ) {
		const status = entityData?.status;
		const isInvalid = ! entityData || status === 'trash';
		const isDraft = status === 'draft';
		return [ isInvalid, isDraft ];
	}

	// For taxonomies, check if entity exists as there is no status.
	if ( isTaxonomy ) {
		const isInvalid = ! entityData; // null/undefined means invalid
		const isDraft = false; // taxonomies don't have draft status
		return [ isInvalid, isDraft ];
	}

	// Fallback
	return [ false, false ];
};
