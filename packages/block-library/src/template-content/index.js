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
import metadata from './block.json';
import edit from './edit';
import icon from './icon';

const { name } = metadata;
export { metadata, name };

export const settings = {
	// Just `src` — letting CSS colour the icon. The `is-synced` class on the
	// List View row (added because `isTemplatePart()` now returns `true` for
	// this block) already paints the icon purple when not selected and white
	// when selected. Setting `foreground` here would apply an inline style
	// that overrides the selected-state colour.
	icon,
	edit,
};

/**
 * Returns true when the editor is currently editing the `root` wp_template
 * entity. Reads selectors via `select()` to avoid a hard dependency on
 * `@wordpress/editor` (which isn't available in every editor context).
 */
function isEditingRootTemplate() {
	// Importing the editor store would create a circular dep
	// (block-library is a lower layer than @wordpress/editor), so we look
	// it up by name at runtime instead.
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const editor = select( 'core/editor' );
	if ( editor?.getCurrentPostType?.() !== 'wp_template' ) {
		return false;
	}
	const postId = editor?.getCurrentPostId?.();
	if ( ! postId ) {
		return false;
	}
	const record = select( coreStore ).getEditedEntityRecord(
		'postType',
		'wp_template',
		postId
	);
	return record?.slug === 'root';
}

export const init = () => {
	addFilter(
		'blockEditor.__unstableCanInsertBlockType',
		'core/template-content/restrict-to-root-template',
		( canInsert, blockType ) => {
			if ( blockType.name !== 'core/template-content' ) {
				return canInsert;
			}
			return isEditingRootTemplate();
		}
	);

	return initBlock( { name, metadata, settings } );
};
