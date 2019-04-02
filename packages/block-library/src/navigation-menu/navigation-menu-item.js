/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './navigation-menu-item-edit';

export const name = 'core/navigation-menu-item';

export const settings = {
	title: __( 'Menu Item (Experimental)' ),

	parent: [ 'core/navigation-menu' ],

	icon: 'admin-links',

	description: __( 'Add a page, link, or other item to your Navigation Menu.' ),

	category: 'common',

	attributes: {
		label: {
			type: 'string',
		},
		destination: {
			type: 'string',
		},
		nofollow: {
			type: 'boolean',
			default: false,
		},
		title: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
		opensInNewTab: {
			type: 'boolean',
			default: false,
		},
	},

	supports: {},

	edit,

	save( { attributes } ) {
		return (
			<li>
				<a
					href={ attributes.destination }
					rel={ attributes.nofollow && 'nofollow' }
					title={ attributes.title }
					target={ attributes.opensInNewTab && '_blank' }
				>
					{ attributes.label }
				</a>
			</li>
		);
	},
};

