/**
 * WordPress dependencies
 */
import { symbol as icon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	edit,
	icon,
};

export const init = () => initBlock( { name, metadata, settings } );

// In order to make sure that blocks retain their full/wide alignments in the editor when converted to synced patterns
// we need to add the layout support to the core/block block wrapper. This is only needed in the editor as there is
// no additional wrapper in the front-end so adding here instead of using the usual supports mechanism in block.json.
function addEditorOnlyLayoutSupportForPatterns( blockSettings ) {
	if ( blockSettings.name === 'core/block' ) {
		if ( ! blockSettings.supports ) {
			blockSettings.supports = {};
		}
		blockSettings.supports.layout = {
			allowSizingOnChildren: true,
			allowEditing: false,
		};
	}

	return blockSettings;
}

addFilter(
	'blocks.registerBlockType',
	'core/synced-patterns/add-editor-only-layout-support-for-patterns',
	addEditorOnlyLayoutSupportForPatterns
);
