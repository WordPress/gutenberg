/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { accordion as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import initBlock from '../utils/init-block';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/accordion-item',
				innerBlocks: [
					{
						name: 'core/accordion-heading',
						attributes: {
							title: __(
								'Lorem ipsum dolor sit amet, consectetur.'
							),
						},
					},
				],
			},
			{
				name: 'core/accordion-item',
				innerBlocks: [
					{
						name: 'core/accordion-heading',
						attributes: {
							title: __(
								'Suspendisse commodo lacus, interdum et.'
							),
						},
					},
				],
			},
		],
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
