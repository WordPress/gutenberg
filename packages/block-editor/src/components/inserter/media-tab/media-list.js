/**
 * WordPress dependencies
 */
// import { useInstanceId } from '@wordpress/compose';
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
	Tooltip,
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
	const title = media.title?.rendered || media.title;
	const baseCssClass = 'block-editor-inserter__media-list';
	return (
		<InserterDraggableBlocks isEnabled={ true } blocks={ [ blocks ] }>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className={ `${ baseCssClass }__list-item` }
					draggable={ draggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				>
					<Tooltip text={ title }>
						<CompositeItem
							role="option"
							as="div"
							{ ...composite }
							className={ `${ baseCssClass }__item` }
							onClick={ () => {
								onClick( blocks );
							} }
							aria-label={ title }
						>
							<BlockPreview
								blocks={ blocks }
								viewportWidth={ 400 }
							/>
						</CompositeItem>
					</Tooltip>
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
