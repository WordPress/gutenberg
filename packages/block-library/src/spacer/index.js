/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Spacer' ),

	description: __( 'Add white space between blocks and customize its height.' ),

	icon,

	edit,

	save( { attributes } ) {
		return <div style={ { height: attributes.height } } aria-hidden />;
	},
};
