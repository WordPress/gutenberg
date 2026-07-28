/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../navigation/constants';

/**
 * Checks if the current editing context is within a navigation overlay template part.
 *
 * This utility exists because @wordpress/block-library cannot depend on @wordpress/editor
 * as a package dependency. Blocks can be loaded into non-post block editors, so we must
 * access the 'core/editor' store by string literal rather than importing it.
 *
 * React components should wrap this in useSelect for reactivity. Non-React contexts
 * (like filter callbacks) can call this directly.
 *
 * @return {boolean} True if editing a navigation overlay template part, false otherwise.
 */
export function isWithinNavigationOverlay() {
	// @wordpress/block-library should not depend on @wordpress/editor.
	// Blocks can be loaded into a *non-post* block editor, so to avoid
	// declaring @wordpress/editor as a dependency, we must access its
	// store by string.
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const editorStore = select( 'core/editor' );

	// Return false if the editor store is not available.
	if ( ! editorStore ) {
		return false;
	}

	const { getCurrentPostType, getCurrentPostId } = editorStore;
	const { getEditedEntityRecord } = select( coreStore );

	const postType = getCurrentPostType?.();
	const postId = getCurrentPostId?.();

	if ( postType === 'wp_template_part' && postId ) {
		const templatePart = getEditedEntityRecord(
			'postType',
			'wp_template_part',
			postId
		);

		return templatePart?.area === NAVIGATION_OVERLAY_TEMPLATE_PART_AREA;
	}

	return false;
}
