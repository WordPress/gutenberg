/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { buttons as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/details',
				attributes: { text: __( 'Find out more' ) },
			},
			{
				name: 'core/details',
				attributes: { text: __( 'Contact us' ) },
			},
		],
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
