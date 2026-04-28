/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { gallery as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';

import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	edit,
	save,
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/slider-pagination',
			},
			{
				name: 'core/slider-track',
				innerBlocks: [
					{
						name: 'core/slide',
						innerBlocks: [
							{
								name: 'core/cover',
								attributes: {
									dimRatio: 100,
									overlayColor: 'black',
									minHeight: 300,
									minHeightUnit: 'px',
								},
								innerBlocks: [
									{
										name: 'core/paragraph',
										attributes: {
											content: __( 'Slide 1' ),
											style: {
												typography: {
													textAlign: 'center',
												},
											},
										},
									},
								],
							},
						],
					},
				],
			},
		],
	},
};

export const init = () => initBlock( { name, metadata, settings } );
