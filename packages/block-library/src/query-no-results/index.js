/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { loop as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
	example: {
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __( 'No posts were found.' ),
				},
			},
		],
	},
};

export const init = () => initBlock( { name, metadata, settings } );
