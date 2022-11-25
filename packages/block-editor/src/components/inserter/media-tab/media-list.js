/**
 * WordPress dependencies
 */
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
	Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useCallback } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import { getBlockAndPreviewFromMedia } from './utils';

function MediaPreview( { media, onClick, composite, mediaType } ) {
	const [ block, preview ] = useMemo(
		() => getBlockAndPreviewFromMedia( media, mediaType ),
		[ media, mediaType ]
	);
	const title = media.title?.rendered || media.title;
	const baseCssClass = 'block-editor-inserter__media-list';
	return (
		<InserterDraggableBlocks isEnabled={ true } blocks={ [ block ] }>
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
								onClick( block );
							} }
							aria-label={ title }
						>
							<div
								className={ `${ baseCssClass }__item-preview` }
							>
								{ preview }
							</div>
						</CompositeItem>
					</Tooltip>
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

function MediaList( {
	mediaList,
	mediaType,
	onClick,
	label = __( 'Media List' ),
} ) {
	const composite = useCompositeState();
	const onPreviewClick = useCallback(
		( block ) => {
			onClick( cloneBlock( block ) );
		},
		[ onClick ]
	);
	return (
		<Composite
			{ ...composite }
			role="listbox"
			className="block-editor-inserter__media-list"
			aria-label={ label }
		>
			{ mediaList.map( ( media ) => (
				<MediaPreview
					key={ media.id }
					media={ media }
					mediaType={ mediaType }
					onClick={ onPreviewClick }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
}

export default MediaList;
