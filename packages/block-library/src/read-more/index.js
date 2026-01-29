/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { link as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	example: {
		attributes: {
			content: __( 'Read more' ),
		},
	},
};

export const init = () => initBlock( { name, metadata, settings } );
