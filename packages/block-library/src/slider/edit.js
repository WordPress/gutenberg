/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl, RangeControl } from '@wordpress/components';

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
							overlayColor: 'black',
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

function normalizeSlidesToShow( slidesToShow, maxSlidesToShow = Infinity ) {
	const parsedSlidesToShow = Number.parseInt( slidesToShow, 10 );

	if ( Number.isNaN( parsedSlidesToShow ) ) {
		return 1;
	}

	return Math.min( maxSlidesToShow, Math.max( 1, parsedSlidesToShow ) );
}

function SliderEdit( { attributes, setAttributes, clientId } ) {
	const totalSlides = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const sliderChildren = getBlocks( clientId );
			const trackBlock = sliderChildren.find(
				( childBlock ) => childBlock.name === 'core/slider-track'
			);

			if ( ! trackBlock ) {
				return 0;
			}

			return trackBlock.innerBlocks.filter(
				( innerBlock ) => innerBlock.name === 'core/slide'
			).length;
		},
		[ clientId ]
	);
	const maxSlidesToShow = Math.max( 1, totalSlides );
	const { loop, slidesToShow } = attributes;
	const normalizedSlidesToShow = normalizeSlidesToShow(
		slidesToShow,
		maxSlidesToShow
	);

	const blockProps = useBlockProps( {
		style: {
			'--wp--slider-slides-to-show': normalizedSlidesToShow,
		},
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: SLIDER_TEMPLATE,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Slider settings' ) }>
					<RangeControl
						label={ __( 'Slides to show' ) }
						help={ __(
							'Number of slides visible at the same time.'
						) }
						value={ normalizedSlidesToShow }
						min={ 1 }
						max={ maxSlidesToShow }
						step={ 1 }
						withInputField
						onChange={ ( value ) =>
							setAttributes( {
								slidesToShow: normalizeSlidesToShow(
									value,
									maxSlidesToShow
								),
							} )
						}
					/>
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
