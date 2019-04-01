/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/spacer';

export const settings = {
	title: __( 'Spacer' ),

	description: __( 'Add white space between blocks and customize its height.' ),

	icon,

	category: 'layout',

	attributes: {
		height: {
			type: 'number',
			default: 100,
		},
	},

	edit,

	save( { attributes } ) {
		return <div style={ { height: attributes.height } } aria-hidden />;
	},
};
