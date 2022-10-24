/**
 * WordPress dependencies
 */
// import { useInstanceId } from '@wordpress/compose';
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import BlockPreview from '../../block-preview';
import { getBlocksFromMedia } from './utils';

function MediaPreview( { media, onClick, composite, mediaType } ) {
	const blocks = getBlocksFromMedia( media, mediaType );
	// TODO: we have to set a max height for previews as the image can be very tall.
	// Probably a fixed-max height for all(?).
	const title = media.title?.rendered || media.title;
	const baseCssClass = 'block-editor-inserter__media-list';
	// const descriptionId = useInstanceId(
	// 	MediaPreview,
	// 	`${ baseCssClass }__item-description`
	// );
	return (
		<InserterDraggableBlocks isEnabled={ true } blocks={ [ blocks ] }>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className={ `${ baseCssClass }__list-item` }
					draggable={ draggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				>
					<CompositeItem
						role="option"
						as="div"
						{ ...composite }
						className={ `${ baseCssClass }__item` }
						onClick={ () => {
							onClick( blocks );
						} }
						aria-label={ title }
						// aria-describedby={}
					>
						<BlockPreview blocks={ blocks } viewportWidth={ 400 } />
						<div className={ `${ baseCssClass }__item-title` }>
							{ title }
						</div>
						{ /* { !! description && (
							<VisuallyHidden id={ descriptionId }>
								{ description }
							</VisuallyHidden>
						) } */ }
					</CompositeItem>
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

function MediaList( {
	results,
	mediaType,
	onClick,
	label = __( 'Media List' ),
} ) {
	const composite = useCompositeState();
	return (
		<Composite
			{ ...composite }
			role="listbox"
			className="block-editor-inserter__media-list"
			aria-label={ label }
		>
			{ results.map( ( media ) => (
				<MediaPreview
					key={ media.id }
					media={ media }
					mediaType={ mediaType }
					onClick={ onClick }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
}

export default MediaList;
