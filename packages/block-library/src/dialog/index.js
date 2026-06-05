/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import icon from './icon';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/dialog-trigger',
				innerBlocks: [
					{
						name: 'core/buttons',
						innerBlocks: [
							{
								name: 'core/button',
								attributes: {
									text: __( 'Open dialog' ),
									tagName: 'button',
								},
							},
						],
					},
				],
			},
			{
				name: 'core/dialog-content',
				innerBlocks: [
					{
						name: 'core/heading',
						attributes: {
							level: 2,
							content: __( 'Dialog heading' ),
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: __( 'Dialog content' ),
						},
					},
				],
			},
		],
	},
	edit,
	save,
};

export const init = () => {
	return initBlock( { name, metadata, settings } );
};
