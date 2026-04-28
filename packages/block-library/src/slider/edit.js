/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';

const SLIDER_TEMPLATE = [
	[ 'core/slider-pagination' ],
	[
		'core/slider-track',
		{ lock: { move: true, remove: true } },
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
										typography: { textAlign: 'center' },
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
										typography: { textAlign: 'center' },
									},
								},
							],
						],
					],
				],
			],
		],
	],
];

function SliderEdit( { attributes, setAttributes } ) {
	const { loop } = attributes;

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: SLIDER_TEMPLATE,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Loop' ) }>
					<ToggleControl
						label={ __( 'Loop' ) }
						help={ __( 'Loop back to the first or last slide.' ) }
						checked={ !! loop }
						onChange={ ( value ) =>
							setAttributes( { loop: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default SliderEdit;
