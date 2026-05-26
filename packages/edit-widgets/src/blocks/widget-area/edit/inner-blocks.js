/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __unstableUseEntityBlockEditorProps as useEntityBlockEditorProps } from '@wordpress/core-data';
import { InnerBlocks, useInnerBlocksProps } from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useIsDraggingWithin from './use-is-dragging-within';

export default function WidgetAreaInnerBlocks( { id } ) {
	const blockEditorProps = useEntityBlockEditorProps( 'root', 'postType' );
	const innerBlocksRef = useRef();
	const isDraggingWithinInnerBlocks = useIsDraggingWithin( innerBlocksRef );
	const shouldHighlightDropZone = isDraggingWithinInnerBlocks;
	// Using the experimental hook so that we can control the className of the element.
	const innerBlocksProps = useInnerBlocksProps(
		{ ref: innerBlocksRef },
		{
			...blockEditorProps,
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
