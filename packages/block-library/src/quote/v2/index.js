/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { quote as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __( 'In quoting others, we cite ourselves.' ),
				},
			},
		],
	},
	edit,
	save,
};

export default settings;
