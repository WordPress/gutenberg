/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import LatestPostsBlock from './block';

export const name = 'core/latest-posts';

export const settings = {
	title: __( 'Latest Posts' ),

	description: __( 'Shows a list of your site\'s most recent posts.' ),

	icon: 'list-view',

	category: 'widgets',

	keywords: [ __( 'recent posts' ) ],

	supports: {
		align: [ 'center', 'wide', 'full' ],
		html: false,
	},

	edit: LatestPostsBlock,

	save() {
		return null;
	},
};
