/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import TagCloudBlock from './block';

export const name = 'core/tag-cloud';

export const settings = {
	title: __( 'Tag Cloud' ),

	description: __( 'A cloud of your most used tags.' ),

	icon: 'tag',

	category: 'widgets',

	attributes: {
		showTagCounts: {
			type: 'boolean',
			default: false,
		},
		taxonomySlug: {
			type: 'string',
		},
		taxonomyRestBase: {
			type: 'string',
		},
		align: {
			type: 'string',
		},
	},

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: TagCloudBlock,

	save() {
		return null;
	},
};
