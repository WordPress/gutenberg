/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import edit from './edit';

export const name = 'core/categories';

export const settings = {
	title: __( 'Categories' ),

	description: __( 'Display a list of all your site\'s categories.' ),

	icon: 'list-view',

	category: 'widgets',

	attributes: {
		showPostCounts: {
			type: 'boolean',
			default: false,
		},
		displayAsDropdown: {
			type: 'boolean',
			default: false,
		},
		showHierarchy: {
			type: 'boolean',
			default: false,
		},
	},

	supports: {
		html: false,
		align: true,
	},

	edit,

	save() {
		return null;
	},
};
