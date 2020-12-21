/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { html as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Throw an error' ),
	description: __( 'Demonstrate an error in the block.' ),
	icon,
	keywords: [ __( 'error' ) ],
	edit,
	save: () => null,
};
