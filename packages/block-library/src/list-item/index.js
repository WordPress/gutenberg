/**
 * WordPress dependencies
 */
import { list as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
	merge( attributes, attributesToMerge ) {
		const { content } = attributesToMerge;
		if ( ! content || content === '<li></li>' ) {
			return attributes;
		}
		return {
			...attributes,
			content: attributes.content + content,
		};
	},
};
