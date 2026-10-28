import { postCategories as icon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import enhanceVariations, { withoutUnusedLayoutClasses } from './hooks';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	deprecated,
};

export const init = () => {
	addFilter(
		'blocks.registerBlockType',
		'core/template-part',
		enhanceVariations
	);

	// Runs before the layout hook (priority 10), so it wraps inside it and sees
	// the layout class names that hook passes down.
	addFilter(
		'editor.BlockListBlock',
		'core/post-terms/without-unused-layout-classes',
		withoutUnusedLayoutClasses,
		5
	);

	return initBlock( { name, metadata, settings } );
};
