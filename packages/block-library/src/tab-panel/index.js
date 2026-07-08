/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { tabPanel as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import metadata from './block.json';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __( 'Type / to choose a block' ),
		},
	],
];

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	template: TEMPLATE,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
