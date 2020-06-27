/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mapMarker as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Link' ),
	icon,
	description: __( 'Add a page, link, or another item to your navigation.' ),
	__experimentalLabel: ( { label } ) => label,
	merge( leftAttributes, { label: rightLabel = '' } ) {
		return {
			...leftAttributes,
			label: leftAttributes.label + rightLabel,
		};
	},
	edit,
	save,
};
