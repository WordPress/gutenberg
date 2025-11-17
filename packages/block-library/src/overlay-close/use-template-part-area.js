/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '../lock-unlock';

const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

/**
 * Hook to check if we're currently editing an overlay template part.
 *
 * @return {boolean} True if editing an overlay template part, false otherwise.
 */
export function useIsOverlayTemplatePart() {
	return useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = unlock(
			select( editorStore )
		);
		const { getEditedEntityRecord } = select( coreStore );
		const postType = getCurrentPostType();
		const postId = getCurrentPostId();

		if ( postType !== TEMPLATE_PART_POST_TYPE || ! postId ) {
			return false;
		}

		const templatePart = getEditedEntityRecord(
			'postType',
			TEMPLATE_PART_POST_TYPE,
			postId
		);

		return templatePart?.area === 'overlay';
	}, [] );
}
