/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useIsDraggingWithin from './use-is-dragging-within';

export default function WidgetAreaInnerBlocks() {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'root',
		'postType'
	);
	const innerBlocksRef = useRef();
	const isDraggingWithinInnerBlocks = useIsDraggingWithin( innerBlocksRef );
	const shouldHighlightDropZone =
		blocks.length === 0 && isDraggingWithinInnerBlocks;

	return (
		<div
			className={
				shouldHighlightDropZone
					? 'edit-widgets-highlight-drop-zone'
					: undefined
			}
		>
			<InnerBlocks
				ref={ innerBlocksRef }
				value={ blocks }
				onInput={ onInput }
				onChange={ onChange }
				templateLock={ false }
				renderAppender={ InnerBlocks.ButtonBlockAppender }
			/>
		</div>
	);
}
