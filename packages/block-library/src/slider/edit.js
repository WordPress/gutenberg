/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useSliderEditorState, useScrollToSelectedSlide } from './hooks';
import { SliderInspectorControls } from './inspector-controls';
import {
	SliderControlBar,
	SliderNavigationButtonsPreview,
	SliderIndicatorsPreview,
} from './slider-components';

const SLIDE_BLOCK = 'core/slide';

const SLIDER_TEMPLATE = [
	[
		SLIDE_BLOCK,
		{},
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
	[
		SLIDE_BLOCK,
		{},
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
	const hasSelectedDescendant = useSelect(
		( select ) =>
			select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId ]
	);

	const { totalSlides, selectedSlideClientId } =
		useSliderEditorState( clientId );

	useScrollToSelectedSlide( trackRef, selectedSlideClientId );

	const maxSlidesToShow = Math.max( 1, totalSlides );
	const {
		slidesToShow,
		arrowIcon,
		indicatorStyle,
		navigationButtonType,
		navigationPosition,
		navigationJustification,
		showIndicators,
	} = attributes;
	const normalizedSlidesToShow = normalizeSlidesToShow(
		slidesToShow,
		maxSlidesToShow
	);

	const addSlide = () =>
		insertBlock( createBlock( SLIDE_BLOCK ), undefined, clientId );

	// blockProps go on the outer wrapper, which is position:relative but does
	// NOT scroll. This is the positioning context for overlay previews.
	const blockProps = useBlockProps( {
		className: `is-arrows-position-${ navigationPosition }`,
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
			<SliderInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
				normalizedSlidesToShow={ normalizedSlidesToShow }
				maxSlidesToShow={ maxSlidesToShow }
			/>
			<div { ...blockProps }>
				{ navigationPosition === 'top' && (
					<SliderControlBar
						navigationPosition="top"
						arrowIcon={ arrowIcon }
						navigationButtonType={ navigationButtonType }
						indicatorStyle={ indicatorStyle }
						showIndicators={ showIndicators }
						navigationJustification={ navigationJustification }
					/>
				) }

				{ navigationPosition === 'overlay' ? (
					<>
						<div { ...innerBlocksProps } />
						{ ! hasSelectedDescendant && (
							<SliderNavigationButtonsPreview
								arrowIcon={ arrowIcon }
								navigationButtonType={ navigationButtonType }
								navigationPosition={ navigationPosition }
								navigationJustification={
									navigationJustification
								}
							/>
						) }
						{ ! hasSelectedDescendant && showIndicators && (
							<SliderIndicatorsPreview
								indicatorStyle={ indicatorStyle }
							/>
						) }
					</>
				) : (
					<div { ...innerBlocksProps } />
				) }

				{ navigationPosition === 'bottom' && (
					<SliderControlBar
						navigationPosition="bottom"
						arrowIcon={ arrowIcon }
						navigationButtonType={ navigationButtonType }
						indicatorStyle={ indicatorStyle }
						showIndicators={ showIndicators }
						navigationJustification={ navigationJustification }
					/>
				) }
			</div>
		</>
	);
}

export default SliderEdit;
