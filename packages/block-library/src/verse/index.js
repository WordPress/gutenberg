/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './tranforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Verse' ),
	description: __( 'Insert poetry. Use special spacing formats. Or quote song lyrics.' ),
	icon,
	keywords: [ __( 'poetry' ) ],
	transforms,
	edit,
	save,
	merge( attributes, attributesToMerge ) {
		return {
			content: attributes.content + attributesToMerge.content,
		};
	},
};
