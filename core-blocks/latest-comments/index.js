/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { DEFAULT_CONTROLS } from 'editor/components/block-alignment-toolbar';
import './style.scss';
import edit from './edit';

export const name = 'core/latest-comments';

export const settings = {
	title: __( 'Latest Comments' ),

	description: __( 'Show a list of your site’s most recent comments.' ),

	icon: 'list-view',

	category: 'widgets',

	keywords: [ __( 'recent comments' ) ],

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;

		if ( DEFAULT_CONTROLS.includes( align ) ) {
			return { 'data-align': align };
		}
	},

	edit,

	save() {
		return null;
	},
};
