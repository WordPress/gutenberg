/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { file as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			href:
				'https://upload.wikimedia.org/wikipedia/commons/d/dd/Armstrong_Small_Step.ogg',
			// translators: Name of the file, which serves as an example for the File block.
			fileName: __( 'Armstrong_Small_Step' ),
		},
	},
	transforms,
	edit,
	save,
};
