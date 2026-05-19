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
import { useDispatch, useSelect } from '@wordpress/data';
import { useLayoutEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	RangeControl,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

const SLIDER_TEMPLATE = [
	[ 'core/slider-pagination', { lock: { move: true, remove: true } } ],
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
];

function normalizeSlidesToShow( slidesToShow, maxSlidesToShow = Infinity ) {
	const parsedSlidesToShow = Number.parseInt( slidesToShow, 10 );

	if ( Number.isNaN( parsedSlidesToShow ) ) {
		return 1;
	}

	return Math.min( maxSlidesToShow, Math.max( 1, parsedSlidesToShow ) );
}

function SliderEdit( { attributes, setAttributes, clientId } ) {
	const trackRef = useRef();
	const { insertBlock, moveBlocksToPosition } =
		useDispatch( blockEditorStore );
	const { totalSlides, selectedSlideClientId, childBlocks } = useSelect(
		( select ) => {
			const {
				getBlocks,
				getBlockOrder,
				getBlockName,
				getBlockParents,
				getBlockRootClientId,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			const sliderChildren = getBlocks( clientId );
			const orderedClientIds = getBlockOrder( clientId );
			const orderedChildBlocks = orderedClientIds.map(
				( childClientId ) => ( {
					clientId: childClientId,
					name: getBlockName( childClientId ),
				} )
			);
			const totalCount = sliderChildren.filter(
				( childBlock ) => childBlock.name === 'core/slide'
			).length;

			const selectedBlockClientId = getSelectedBlockClientId();
			if ( ! selectedBlockClientId ) {
				return {
					totalSlides: totalCount,
					selectedSlideClientId: null,
					childBlocks: orderedChildBlocks,
				};
			}

			const selectedBlockParents = getBlockParents(
				selectedBlockClientId,
				true
			);
			const parentSlideClientId = selectedBlockParents.find(
				( parentId ) => getBlockName( parentId ) === 'core/slide'
			);
			const candidateSlideClientId =
				getBlockName( selectedBlockClientId ) === 'core/slide'
					? selectedBlockClientId
					: parentSlideClientId;

			if ( ! candidateSlideClientId ) {
				return {
					totalSlides: totalCount,
					selectedSlideClientId: null,
					childBlocks: orderedChildBlocks,
				};
			}

			return {
				totalSlides: totalCount,
				childBlocks: orderedChildBlocks,
				selectedSlideClientId:
					getBlockRootClientId( candidateSlideClientId ) === clientId
						? candidateSlideClientId
						: null,
			};
		},
		[ clientId ]
	);

	useLayoutEffect( () => {
		let rafId;
		let view;

		if ( selectedSlideClientId && trackRef.current ) {
			const trackElement = trackRef.current;
			view = trackElement.ownerDocument?.defaultView;

			if ( view ) {
				const selectedSlideElement = trackElement.querySelector(
					`[data-block="${ selectedSlideClientId }"]`
				);

				if ( ! selectedSlideElement ) {
					return;
				}

				const trackRect = trackElement.getBoundingClientRect();
				const slideRect = selectedSlideElement.getBoundingClientRect();
				const startLeft = trackElement.scrollLeft;
				const delta = slideRect.left - trackRect.left;

				if ( delta === 0 ) {
					return;
				}

				const DURATION = 2600; // ms - intentionally very slow.
				const startTime = view.performance.now();

				const step = ( timestamp ) => {
					const elapsed = timestamp - startTime;
					const progress = Math.min( elapsed / DURATION, 1 );
					trackElement.scrollLeft = startLeft + delta * progress;
					if ( progress < 1 ) {
						rafId = view.requestAnimationFrame( step );
					}
				};

				step( startTime );
				rafId = view.requestAnimationFrame( step );
			}
		}

		return () => {
			if ( view && rafId !== undefined ) {
				view.cancelAnimationFrame( rafId );
			}
		};
	}, [ selectedSlideClientId ] );

	useLayoutEffect( () => {
		if ( ! childBlocks?.length ) {
			return;
		}

		const paginationIndex = childBlocks.findIndex(
			( childBlock ) => childBlock.name === 'core/slider-pagination'
		);
		if ( paginationIndex === -1 ) {
			return;
		}

		const slideIndices = childBlocks
			.map( ( childBlock, index ) =>
				childBlock.name === 'core/slide' ? index : -1
			)
			.filter( ( index ) => index >= 0 );
		if ( slideIndices.length < 2 ) {
			return;
		}

		const firstSlideIndex = slideIndices[ 0 ];
		const lastSlideIndex = slideIndices[ slideIndices.length - 1 ];
		const isBetweenSlides =
			paginationIndex > firstSlideIndex &&
			paginationIndex < lastSlideIndex;
		if ( ! isBetweenSlides ) {
			return;
		}

		const distanceToStart = paginationIndex - firstSlideIndex;
		const distanceToEnd = lastSlideIndex - paginationIndex;
		const moveToStart = distanceToStart <= distanceToEnd;
		const destinationIndex = moveToStart ? 0 : childBlocks.length;
		const paginationClientId = childBlocks[ paginationIndex ].clientId;

		moveBlocksToPosition(
			[ paginationClientId ],
			clientId,
			clientId,
			destinationIndex
		);
	}, [ childBlocks, clientId, moveBlocksToPosition ] );

	const maxSlidesToShow = Math.max( 1, totalSlides );
	const { loop, slidesToShow } = attributes;
	const normalizedSlidesToShow = normalizeSlidesToShow(
		slidesToShow,
		maxSlidesToShow
	);

	const addSlide = () => {
		insertBlock( createBlock( 'core/slide' ), undefined, clientId );
	};

	const blockProps = useBlockProps( {
		ref: trackRef,
		style: {
			'--wp--slider-slides-to-show': normalizedSlidesToShow,
		},
	} );

	/*
	 * Use the parent slider block as the inner blocks container in the editor.
	 * This avoids private block-editor imports while still allowing horizontal
	 * scrolling to the selected slide.
	 */
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
