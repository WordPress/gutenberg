/**
 * WordPress dependencies
 */
import { mapMarker as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';
import transforms from './transforms';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	example: {
		viewportWidth: 350,
		attributes: {
			textAlign: 'center',
		},
	},
	edit,
	transforms,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
