/**
 * External dependencies
 */
import clsx from 'clsx';

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
import { useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const SLIDE_TEMPLATE = [ [ 'core/slide' ] ];

function SliderTrackEdit( { clientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	const addSlide = () => {
		const newSlideBlock = createBlock( 'core/slide' );
		insertBlock( newSlideBlock, undefined, clientId );
	};

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-slider-track' ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/slide' ],
		template: SLIDE_TEMPLATE,
		renderAppender: false,
	} );

	return (
		<>
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarButton
						className="components-toolbar__control"
						label={ __( 'Add Slide' ) }
						onClick={ addSlide }
						showTooltip
						text={ __( 'Add Slide' ) }
					/>
				</ToolbarGroup>
			</BlockControls>
			<div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>
		</>
	);
}

export default SliderTrackEdit;
