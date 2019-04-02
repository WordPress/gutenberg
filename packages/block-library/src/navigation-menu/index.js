/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './navigation-menu-edit';

export const name = 'core/navigation-menu';

export const settings = {
	title: __( 'Navigation Menu (Experimental)' ),

	icon: 'menu',

	category: 'layout',

	description: __( 'Add a navigation menu to your site.' ),

	keywords: [ __( 'menu' ), __( 'navigation' ), __( 'links' ) ],

	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
		html: false,
	},

	attributes: {
		automaticallyAdd: {
			type: 'boolean',
			default: 'false',
		},
	},

	edit,

	save() {
		return (
			<ul>
				<InnerBlocks.Content />
			</ul>
		);
	},
};
