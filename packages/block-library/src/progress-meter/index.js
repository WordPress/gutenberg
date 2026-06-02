/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { progressMeter as icon } from '@wordpress/icons';

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
		attributes: {
			label: _x( 'Progress Meter', 'block example' ),
		},
	},
};

export const init = () => initBlock( { name, metadata, settings } );
