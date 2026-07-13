/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { page as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __( 'Add any blocks you like inside a slide.' ),
				},
			},
		],
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
