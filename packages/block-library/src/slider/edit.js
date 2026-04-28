/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';

const SLIDER_TEMPLATE = [
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
	const { sliderId, loop } = attributes;
	const instanceId = useInstanceId( SliderEdit );
	// Generate unique ID for the slider
	useEffect( () => {
		if ( ! sliderId ) {
			setAttributes( { sliderId: instanceId } );
		}
	}, [ sliderId, setAttributes, instanceId ] );

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: SLIDER_TEMPLATE,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Slider Settings' ) }>
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
