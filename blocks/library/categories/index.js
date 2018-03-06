/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import CategoriesBlock from './block';

export const name = 'core/categories';

export const settings = {
	title: __( 'Categories' ),

	description: __( 'Shows a list of your site\'s categories.' ),

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
		align: [ 'left', 'center', 'right', 'full' ],
		html: false,
	},

	edit: CategoriesBlock,

	save() {
		return null;
	},
};
