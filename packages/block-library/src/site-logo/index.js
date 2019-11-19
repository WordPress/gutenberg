/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import icon from './icon';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Site Logo' ),
	description: __( 'Show a site logo' ),
	icon,
	getEditWrapperProps( attributes ) {
		const { align, width } = attributes;
		if ( 'left' === align || 'center' === align || 'right' === align ) {
			return { 'data-align': align, 'data-resized': !! width };
		}
	},
	edit,
};
