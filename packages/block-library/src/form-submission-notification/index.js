/**
 * WordPress dependencies
 */
import { group as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

const TEMPLATE = [
	[
		'core/paragraph',
		{
			content: __(
				"Enter the message you wish displayed for form submission error/success, and select the type of the message (success/error) from the block's options."
			),
		},
	],
];

export const settings = {
	icon,
	template: TEMPLATE,
	edit,
	save,
	variations,
	example: {},
};

export const init = () => initBlock( { name, metadata, settings } );
