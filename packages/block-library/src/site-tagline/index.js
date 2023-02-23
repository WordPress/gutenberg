/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import icon from './icon';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	example: {
		attributes: {
			placeholder: __( 'A site tagline.' ),
		},
	},
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
