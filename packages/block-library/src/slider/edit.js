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
	SelectControl,
	ToolbarGroup,
	ToolbarButton,
	Icon as WCIcon,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import {
	chevronLeft,
	chevronRight,
	arrowLeft,
	arrowRight,
	moreHorizontal,
	lineSolid,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useSliderChildren, useScrollToSelectedSlide } from './hooks';

const SLIDE_BLOCK = 'core/slide';
const iconMap = {
	chevron: { previous: chevronLeft, next: chevronRight },
	arrow: { previous: arrowLeft, next: arrowRight },
};

const SLIDER_TEMPLATE = [
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

function SliderPaginationNavigationButtonTypeControls( { value, onChange } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Type' ) }
			value={ value }
			onChange={ onChange }
			isBlock
			help={ __( 'Adjust the appearance of buttons in the slider.' ) }
		>
			<ToggleGroupControlOption value="icon" label={ __( 'Icon' ) } />
			<ToggleGroupControlOption value="text" label={ __( 'Text' ) } />
			<ToggleGroupControlOption value="both" label={ __( 'Both' ) } />
		</ToggleGroupControl>
	);
}

function SliderPaginationArrowControls( { value, onChange } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Button icon' ) }
			value={ value }
			onChange={ onChange }
			help={ __( 'Icon style for the previous and next slide buttons.' ) }
			isBlock
		>
			<ToggleGroupControlOptionIcon
				value="chevron"
				icon={ chevronLeft }
				label={ __( 'Chevron' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="arrow"
				icon={ arrowLeft }
				label={ __( 'Arrow' ) }
			/>
		</ToggleGroupControl>
	);
}

function SliderPaginationIndicatorControls( { value, onChange } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Indicator icon' ) }
			value={ value }
			onChange={ onChange }
			help={ __( 'Shape of the indicators showing the current slide.' ) }
			isBlock
		>
			<ToggleGroupControlOptionIcon
				value="dot"
				icon={ moreHorizontal }
				label={ __( 'Dot' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="line"
				icon={ lineSolid }
				label={ __( 'Line' ) }
			/>
		</ToggleGroupControl>
	);
}

function SliderArrowButton( { type, arrowIcon, navigationButtonType } ) {
	const icons = iconMap[ arrowIcon ] || iconMap.chevron;
	const isPrevious = type === 'previous';
	const buttonLabel = isPrevious ? __( 'Previous' ) : __( 'Next' );
	const icon = isPrevious ? icons.previous : icons.next;
	const iconElement = (
		<WCIcon className="wp-block-slider-arrows-button__icon" icon={ icon } />
	);
	const textElement = (
		<span className="wp-block-slider-arrows-button__text">
			{ buttonLabel }
		</span>
	);

	let content;
	if ( navigationButtonType === 'icon' ) {
		content = iconElement;
	} else if ( navigationButtonType === 'text' ) {
		content = textElement;
	} else {
		content = isPrevious ? (
			<>
				{ iconElement }
				{ textElement }
			</>
		) : (
			<>
				{ textElement }
				{ iconElement }
			</>
		);
	}

	return (
		<button
			type="button"
			className={ `wp-block-slider-arrows-button is-type-${ type } is-icon-${ arrowIcon }` }
			disabled
			tabIndex={ -1 }
		>
			{ content }
		</button>
	);
}

function SliderIndicatorDots( { indicatorStyle } ) {
	return (
		<div
			className={ `wp-block-slider-indicators__dots is-style-${ indicatorStyle }` }
		>
			{ [ 0, 1, 2 ].map( ( index ) => (
				<button
					key={ index }
					type="button"
					className={ `wp-block-slider-indicators__dot${
						index === 0 ? ' is-active' : ''
					}` }
					disabled
					tabIndex={ -1 }
				/>
			) ) }
		</div>
	);
}

function SliderControlBar( {
	position,
	arrowIcon,
	navigationButtonType,
	indicatorStyle,
	showArrows,
	showIndicators,
} ) {
	return (
		<div
			className={ `wp-block-slider-control-bar is-position-${ position }` }
		>
			{ showArrows && (
				<SliderArrowButton
					type="previous"
					arrowIcon={ arrowIcon }
					navigationButtonType={ navigationButtonType }
				/>
			) }
			{ showIndicators && (
				<SliderIndicatorDots indicatorStyle={ indicatorStyle } />
			) }
			{ showArrows && (
				<SliderArrowButton
					type="next"
					arrowIcon={ arrowIcon }
					navigationButtonType={ navigationButtonType }
				/>
			) }
		</div>
	);
}

function SliderArrowsPreview( {
	arrowIcon,
	navigationButtonType,
	arrowsPosition,
} ) {
	if ( arrowsPosition === 'none' ) {
		return null;
	}
	return (
		<div
			className={ `wp-block-slider-arrows is-position-${ arrowsPosition }` }
		>
			<SliderArrowButton
				type="previous"
				arrowIcon={ arrowIcon }
				navigationButtonType={ navigationButtonType }
			/>
			<SliderArrowButton
				type="next"
				arrowIcon={ arrowIcon }
				navigationButtonType={ navigationButtonType }
			/>
		</div>
	);
}

function SliderIndicatorsPreview( { indicatorStyle, indicatorsPosition } ) {
	if ( indicatorsPosition === 'none' ) {
		return null;
	}
	return (
		<div
			className={ `wp-block-slider-indicators is-position-${ indicatorsPosition }` }
		>
			<SliderIndicatorDots indicatorStyle={ indicatorStyle } />
		</div>
	);
}

const ARROWS_POSITION_OPTIONS = [
	{ label: __( 'Overlay slides' ), value: 'overlay' },
	{ label: __( 'Sides of slides' ), value: 'sides' },
	{ label: __( 'Above slides' ), value: 'top' },
	{ label: __( 'Below slides' ), value: 'bottom' },
	{ label: __( 'Hidden' ), value: 'none' },
];

const INDICATORS_POSITION_OPTIONS = [
	{ label: __( 'Overlay slides' ), value: 'overlay' },
	{ label: __( 'Above slides' ), value: 'top' },
	{ label: __( 'Below slides' ), value: 'bottom' },
	{ label: __( 'Hidden' ), value: 'none' },
];

function SliderEdit( { attributes, setAttributes, clientId } ) {
	const trackRef = useRef();
	const { insertBlock } = useDispatch( blockEditorStore );

	const { totalSlides, selectedSlideClientId } =
		useSliderChildren( clientId );

	useScrollToSelectedSlide( trackRef, selectedSlideClientId );

	const maxSlidesToShow = Math.max( 1, totalSlides );
	const {
		loop,
		slidesToShow,
		arrowIcon,
		indicatorStyle,
		navigationButtonType = 'icon',
		arrowsPosition = 'overlay',
		indicatorsPosition = 'overlay',
	} = attributes;
	const normalizedSlidesToShow = normalizeSlidesToShow(
		slidesToShow,
		maxSlidesToShow
	);

	const addSlide = () =>
		insertBlock( createBlock( SLIDE_BLOCK ), undefined, clientId );

	// blockProps go on the outer wrapper, which is position:relative but does
	// NOT scroll. This is the positioning context for overlay/sides previews.
	const blockProps = useBlockProps( {
		className: `is-arrows-position-${ arrowsPosition } is-indicators-position-${ indicatorsPosition }`,
		style: { '--wp--slider-slides-to-show': normalizedSlidesToShow },
	} );

	// innerBlocksProps go on the inner scroll container. The ref is on this
	// element so useScrollToSelectedSlide targets the actual scrolling div.
	const innerBlocksProps = useInnerBlocksProps(
		{ ref: trackRef },
		{
			template: SLIDER_TEMPLATE,
			renderAppender: false,
			__unstableDisableLayoutClassNames: true,
		}
	);

	// In-flow positions (top/bottom) render as rows before/after the scroll container.
	// Positioned (overlay/sides) are absolutely placed over the scroll container.
	const arrowsInFlow =
		arrowsPosition === 'top' || arrowsPosition === 'bottom';
	const indicatorsInFlow =
		indicatorsPosition === 'top' || indicatorsPosition === 'bottom';

	// When arrows and indicators share the same in-flow position they are merged
	// into one combined bar: [prev] [indicators] [next].
	const sharedInFlowPosition =
		arrowsInFlow &&
		indicatorsInFlow &&
		arrowsPosition === indicatorsPosition
			? arrowsPosition
			: null;

	// Helpers for the render below.
	const renderControlBar = ( position ) => (
		<SliderControlBar
			position={ position }
			arrowIcon={ arrowIcon }
			navigationButtonType={ navigationButtonType }
			indicatorStyle={ indicatorStyle }
			showArrows={ arrowsPosition !== 'none' }
			showIndicators={ indicatorsPosition !== 'none' }
		/>
	);
	const renderArrows = () => (
		<SliderArrowsPreview
			arrowIcon={ arrowIcon }
			navigationButtonType={ navigationButtonType }
			arrowsPosition={ arrowsPosition }
		/>
	);
	const renderIndicators = () => (
		<SliderIndicatorsPreview
			indicatorStyle={ indicatorStyle }
			indicatorsPosition={ indicatorsPosition }
		/>
	);

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
				<PanelBody title={ __( 'Arrows' ) }>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Position' ) }
						value={ arrowsPosition }
						options={ ARROWS_POSITION_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { arrowsPosition: value } )
						}
					/>
					{ arrowsPosition !== 'none' && (
						<>
							<SliderPaginationNavigationButtonTypeControls
								value={ navigationButtonType }
								onChange={ ( value ) =>
									setAttributes( {
										navigationButtonType: value,
									} )
								}
							/>
							<SliderPaginationArrowControls
								value={ arrowIcon }
								onChange={ ( value ) =>
									setAttributes( { arrowIcon: value } )
								}
							/>
						</>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Indicators' ) }>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Position' ) }
						value={ indicatorsPosition }
						options={ INDICATORS_POSITION_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { indicatorsPosition: value } )
						}
					/>
					{ indicatorsPosition !== 'none' && (
						<SliderPaginationIndicatorControls
							value={ indicatorStyle }
							onChange={ ( value ) =>
								setAttributes( { indicatorStyle: value } )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			{ /*
			 * Two-level structure in the editor:
			 *
			 * <div blockProps>            — outer wrapper: position:relative, no scroll,
			 *                               positioning context for overlay/sides previews
			 *   [in-flow top previews]   — normal block-flow rows above the slides
			 *   <div innerBlocksProps>   — scroll container: overflow-x:auto, holds slides
			 *     [slides]              — direct children, inline-block side-by-side
			 *   </div>
			 *   [positioned previews]   — absolute children of the outer wrapper,
			 *                               positioned relative to the visible block area
			 *   [in-flow bottom previews]
			 * </div>
			 *
			 * Keeping the positioned previews outside the scroll container means
			 * their left/top percentages resolve against the block's clientWidth,
			 * not its scrollWidth, so they stay fixed as slides are scrolled.
			 */ }
			<div { ...blockProps }>
				{ /* Top row: combined bar, or individual elements. */ }
				{ sharedInFlowPosition === 'top' && renderControlBar( 'top' ) }
				{ ! sharedInFlowPosition &&
					arrowsInFlow &&
					arrowsPosition === 'top' &&
					renderArrows() }
				{ ! sharedInFlowPosition &&
					indicatorsInFlow &&
					indicatorsPosition === 'top' &&
					renderIndicators() }

				<div { ...innerBlocksProps } />

				{ /* Positioned (overlay/sides): absolute, rendered after the scroll div. */ }
				{ ! arrowsInFlow && renderArrows() }
				{ ! indicatorsInFlow && renderIndicators() }

				{ /* Bottom row: combined bar, or individual elements. */ }
				{ sharedInFlowPosition === 'bottom' &&
					renderControlBar( 'bottom' ) }
				{ ! sharedInFlowPosition &&
					arrowsInFlow &&
					arrowsPosition === 'bottom' &&
					renderArrows() }
				{ ! sharedInFlowPosition &&
					indicatorsInFlow &&
					indicatorsPosition === 'bottom' &&
					renderIndicators() }
			</div>
		</>
	);
}

export default SliderEdit;
