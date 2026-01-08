/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import icon from './icon';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
};

function isWithinOverlay() {
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

	const postType = getCurrentPostType();
	const postId = getCurrentPostId();

	if ( postType === 'wp_template_part' && postId ) {
		const templatePartEntity = getEditedEntityRecord(
			'postType',
			'wp_template_part',
			postId
		);

		return templatePartEntity?.area === 'overlay';
	}

	return false;
}

export const init = () => {
	addFilter(
		'blockEditor.__unstableCanInsertBlockType',
		'core/navigation-overlay-close/restrict-to-overlay-template-parts',
		( canInsert, blockType ) => {
			if ( blockType.name !== 'core/navigation-overlay-close' ) {
				return canInsert;
			}

			if ( ! canInsert ) {
				return canInsert;
			}

			return isWithinOverlay();
		}
	);

	return initBlock( { name, metadata, settings } );
};
