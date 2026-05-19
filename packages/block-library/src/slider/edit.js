/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	RangeControl,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	useSliderChildren,
	useScrollToSelectedSlide,
	usePaginationPlacement,
} from './hooks';

const SLIDE_BLOCK = 'core/slide';
const PAGINATION_BLOCK = 'core/slider-pagination';

const SLIDER_TEMPLATE = [
	[ PAGINATION_BLOCK, { lock: { move: true, remove: true } } ],
	[
		SLIDE_BLOCK,
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
							style: { typography: { textAlign: 'center' } },
						},
					],
				],
			],
		],
	],
	[
		SLIDE_BLOCK,
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
							style: { typography: { textAlign: 'center' } },
						},
					],
				],
			],
		],
	],
];

function normalizeSlidesToShow( slidesToShow, maxSlidesToShow = Infinity ) {
	const parsed = Number.parseInt( slidesToShow, 10 );
	if ( Number.isNaN( parsed ) ) {
		return 1;
	}
	return Math.min( maxSlidesToShow, Math.max( 1, parsed ) );
}

function SliderEdit( { attributes, setAttributes, clientId } ) {
	const trackRef = useRef();
	const { insertBlock } = useDispatch( blockEditorStore );

	const { totalSlides, selectedSlideClientId } =
		useSliderChildren( clientId );

	useScrollToSelectedSlide( trackRef, selectedSlideClientId );
	usePaginationPlacement( clientId );

	const maxSlidesToShow = Math.max( 1, totalSlides );
	const { loop, slidesToShow } = attributes;
	const normalizedSlidesToShow = normalizeSlidesToShow(
		slidesToShow,
		maxSlidesToShow
	);

	const addSlide = () =>
		insertBlock( createBlock( SLIDE_BLOCK ), undefined, clientId );

	const blockProps = useBlockProps( {
		ref: trackRef,
		style: { '--wp--slider-slides-to-show': normalizedSlidesToShow },
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: SLIDER_TEMPLATE,
		renderAppender: false,
		__unstableDisableLayoutClassNames: true,
	} );

	return (
		<>
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarButton
						className="components-toolbar__control"
						onClick={ addSlide }
						text={ __( 'Add Slide' ) }
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Slider settings' ) }>
					<RangeControl
						__next40pxDefaultSize
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
