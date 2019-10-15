/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'List (new)' ),
	description: __( 'You can hide anything here!' ),
	icon: 'arrow-down',
	save,
	edit,
};
