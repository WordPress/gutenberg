/**
 * WordPress dependencies
 */
import { details as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

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
	example: {
		innerBlocks: [
			{
				name: 'core/details-summary',
				attributes: { summary: __( 'Details' ) },
			},
			{
				name: 'core/details-content',
			},
		],
	},
	save,
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
