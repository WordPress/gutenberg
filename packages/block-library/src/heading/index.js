/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Heading' ),
	description: __( 'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.' ),
	icon: 'heading',
	keywords: [ __( 'title' ), __( 'subtitle' ) ],
	supports: {
		className: false,
		anchor: true,
	},
	transforms,
	deprecated,
	merge( attributes, attributesToMerge ) {
		return {
			content: ( attributes.content || '' ) + ( attributesToMerge.content || '' ),
		};
	},
	edit,
	save,
};
