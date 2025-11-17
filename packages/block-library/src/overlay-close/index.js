/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { close } from '@wordpress/icons';
import { select as dataSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '../lock-unlock';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

export { metadata, name };

export const settings = {
	icon: close,
	edit,
	save,
};

export const init = () => {
	initBlock( { name, metadata, settings } );

	// Restrict overlay-close block to only overlay template parts
	addFilter(
		'blockEditor.__unstableCanInsertBlockType',
		'core/overlay-close/restrict-to-overlay',
		( canInsert, blockType ) => {
			if ( blockType.name !== 'core/overlay-close' ) {
				return canInsert;
			}

			// Check if we're in an overlay template part
			const { getCurrentPostType, getCurrentPostId } = unlock(
				dataSelect( editorStore )
			);
			const { getEditedEntityRecord } = dataSelect( coreStore );
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
		}
	);
};
