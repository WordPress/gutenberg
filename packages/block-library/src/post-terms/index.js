import { postCategories as icon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import enhanceVariations, {
	hideBlockGapOutsideFlexAndGrid,
	hideTextAlignInFlexAndGrid,
} from './hooks';
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

	addFilter(
		'blockEditor.useSetting.before',
		'core/post-terms/hide-block-gap-outside-flex-and-grid',
		hideBlockGapOutsideFlexAndGrid
	);

	addFilter(
		'blockEditor.useSetting.before',
		'core/post-terms/hide-text-align-in-flex-and-grid',
		hideTextAlignInFlexAndGrid
	);

	return initBlock( { name, metadata, settings } );
};
