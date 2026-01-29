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
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit,
	variations,
	example: {
		attributes: {
			label: __( 'Next post' ),
			arrow: 'arrow',
		},
	},
};

export const init = () => initBlock( { name, metadata, settings } );
