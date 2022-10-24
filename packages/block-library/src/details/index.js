/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { plus as icon } from '@wordpress/icons';

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
		attributes: {
			summary: __( 'Click the arrow to expand' ),
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __( 'Details text that can be toggled to an opened or closed state.' ),
				},
			},
		],
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
