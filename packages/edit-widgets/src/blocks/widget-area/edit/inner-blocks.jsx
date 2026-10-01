import clsx from 'clsx';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { InnerBlocks, useInnerBlocksProps } from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';
import useIsDraggingWithin from './use-is-dragging-within';

export default function WidgetAreaInnerBlocks( { id } ) {
	const [ blocks, onInput, onChange, { selection, onChangeSelection } ] =
		useEntityBlockEditor( 'root', 'postType' );
	const innerBlocksRef = useRef();
	const isDraggingWithinInnerBlocks = useIsDraggingWithin( innerBlocksRef );
	const shouldHighlightDropZone = isDraggingWithinInnerBlocks;
	// Using the experimental hook so that we can control the className of the element.
	const innerBlocksProps = useInnerBlocksProps(
		{ ref: innerBlocksRef },
		{
			value: blocks,
			onInput,
			onChange,
			selection,
			onChangeSelection,
			templateLock: false,
			renderAppender: InnerBlocks.ButtonBlockAppender,
		}
	);

	return (
		<div
			data-widget-area-id={ id }
			className={ clsx(
				'wp-block-widget-area__inner-blocks block-editor-inner-blocks editor-styles-wrapper',
				{
					'wp-block-widget-area__highlight-drop-zone':
						shouldHighlightDropZone,
				}
			) }
		>
			<div { ...innerBlocksProps } />
		</div>
	);
}
