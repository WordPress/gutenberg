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
			[ 'core/slider-pagination' ],
			[
				'core/slider-track',
				{},
				[
					[
						'core/slide',
						{},
						[
							[
								'core/cover',
								{
									dimRatio: 100,
									overlayColor: 'black',
									minHeight: 300,
									minHeightUnit: 'px',
								},
								[
									[
										'core/paragraph',
										{
											content: __( 'Slide 1' ),
											style: {
												typography: {
													textAlign: 'center',
												},
											},
										},
									],
								],
							],
						],
					],
					[
						'core/slide',
						{},
						[
							[
								'core/cover',
								{
									dimRatio: 100,
									overlayColor: 'cyan-bluish-gray',
									minHeight: 300,
									minHeightUnit: 'px',
								},
								[
									[
										'core/paragraph',
										{
											content: __( 'Slide 2' ),
											style: {
												typography: {
													textAlign: 'center',
												},
											},
										},
									],
								],
							],
						],
					],
				],
			],
		],
	},
};

export const init = () => initBlock( { name, metadata, settings } );
