/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { quote as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import transforms from './transforms';
import deprecated from './deprecated';

const settings = {
	icon,
	example: {
		attributes: {
			citation: 'Julio Cortázar',
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __( 'In quoting others, we cite ourselves.' ),
				},
			},
		],
	},
	transforms,
	edit,
	save,
	deprecated,
};

export default settings;
