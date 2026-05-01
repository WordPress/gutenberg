/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useLayoutEffect, useRef } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const SLIDE_TEMPLATE = [ [ 'core/slide' ] ];

function SliderTrackEdit( { clientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );
	const trackRef = useRef();
	const { selectedSlideClientId } = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockParents,
				getBlockRootClientId,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			const selectedBlockClientId = getSelectedBlockClientId();

			if ( ! selectedBlockClientId ) {
				return { selectedSlideClientId: null };
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
				return { selectedSlideClientId: null };
			}

			return {
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
				rafId = view.requestAnimationFrame( () => {
					const selectedSlideElement = trackElement.querySelector(
						`[data-block="${ selectedSlideClientId }"]`
					);

					if ( ! selectedSlideElement ) {
						return;
					}

					const trackRect = trackElement.getBoundingClientRect();
					const slideRect =
						selectedSlideElement.getBoundingClientRect();

					trackElement.scrollTo( {
						left:
							trackElement.scrollLeft +
							( slideRect.left - trackRect.left ),
						behavior: 'auto',
					} );
				} );
			}
		}

		return () => {
			if ( view && rafId !== undefined ) {
				view.cancelAnimationFrame( rafId );
			}
		};
	}, [ selectedSlideClientId ] );

	const addSlide = () => {
		const newSlideBlock = createBlock( 'core/slide' );
		insertBlock( newSlideBlock, undefined, clientId );
	};

	const blockProps = useBlockProps( {
		ref: trackRef,
		className: 'wp-block-slider-track',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: SLIDE_TEMPLATE,
		renderAppender: false,
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
			<div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>
		</>
	);
}

export default SliderTrackEdit;
