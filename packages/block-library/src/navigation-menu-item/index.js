/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Menu Item (Experimental)' ),

	parent: [ 'core/navigation-menu' ],

	icon: 'admin-links',

	description: __( 'Add a page, link, or other item to your Navigation Menu.' ),

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

