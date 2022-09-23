/**
 * WordPress dependencies
 */
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import BlockPreview from '../../block-preview';

function ImagePreview( { image, onClick, composite } ) {
	// TODO: Check caption or attribution, etc..
	const blocks = createBlock( 'core/image', {
		url: image.thumbnail || image.url,
	} );
	// TODO: we have to set a max height for previews as the image can be very tall.
	// Probably a fixed-max height for all(?).
	return (
		<InserterDraggableBlocks isEnabled={ true } blocks={ [ blocks ] }>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className="block-editor-inserter-external-images-list__list-item"
					aria-label={ image.title }
					// aria-describedby={}
					draggable={ draggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				>
					<CompositeItem
						role="option"
						as="div"
						{ ...composite }
						className="block-editor-inserter-external-images-list__item"
						onClick={ () => {
							// TODO: We need to handle the case with focus to image's caption
							// during insertion. This makes the inserter to close.
							onClick( image );
						} }
					>
						<BlockPreview blocks={ blocks } viewportWidth={ 400 } />
					</CompositeItem>
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

function ExternalImagesList( {
	results,
	onClick,
	orientation,
	label = __( 'External Images List' ),
} ) {
	const composite = useCompositeState( { orientation } );
	return (
		<Composite
			{ ...composite }
			role="listbox"
			className="block-editor-image-explorer__list"
			aria-label={ label }
		>
			{ results.map( ( image ) => (
				<ImagePreview
					key={ image.id }
					image={ image }
					onClick={ onClick }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
}

export default ExternalImagesList;
