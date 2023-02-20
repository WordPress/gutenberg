/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
	Tooltip,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useCallback, useState } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';
import { moreVertical, external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import { getBlockAndPreviewFromMedia } from './utils';

const MAXIMUM_TITLE_LENGTH = 25;
const MEDIA_OPTIONS_POPOVER_PROPS = {
	position: 'bottom left',
	className:
		'block-editor-inserter__media-list__item-preview-options__popover',
};

function MediaPreviewOptions( { category, media } ) {
	if ( ! category.getReportUrl ) {
		return null;
	}
	const reportUrl = category.getReportUrl( media );
	return (
		<DropdownMenu
			className="block-editor-inserter__media-list__item-preview-options"
			label={ __( 'Options' ) }
			popoverProps={ MEDIA_OPTIONS_POPOVER_PROPS }
			icon={ moreVertical }
		>
			{ () => (
				<MenuGroup>
					<MenuItem
						onClick={ () =>
							window.open( reportUrl, '_blank' ).focus()
						}
						icon={ external }
					>
						{ sprintf(
							/* translators: %s: The media type to report e.g: "image", "video", "audio" */
							__( 'Report %s' ),
							category.mediaType
						) }
					</MenuItem>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}

function MediaPreview( { media, onClick, composite, category } ) {
	const [ isHovered, setIsHovered ] = useState( false );
	const [ block, preview ] = useMemo(
		() => getBlockAndPreviewFromMedia( media, category.mediaType ),
		[ media, category.mediaType ]
	);
	const title = media.title?.rendered || media.title;
	let truncatedTitle;
	if ( title.length > MAXIMUM_TITLE_LENGTH ) {
		const omission = '...';
		truncatedTitle =
			title.slice( 0, MAXIMUM_TITLE_LENGTH - omission.length ) + omission;
	}
	const onMouseEnter = useCallback( () => setIsHovered( true ), [] );
	const onMouseLeave = useCallback( () => setIsHovered( false ), [] );
	return (
		<InserterDraggableBlocks isEnabled={ true } blocks={ [ block ] }>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className={ classnames(
						'block-editor-inserter__media-list__list-item',
						{
							'is-hovered': isHovered,
						}
					) }
					draggable={ draggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				>
					<Tooltip text={ truncatedTitle || title }>
						{ /* Adding `is-hovered` class to the wrapper element is needed
							because the options Popover is rendered outside of this node. */ }
						<div
							onMouseEnter={ onMouseEnter }
							onMouseLeave={ onMouseLeave }
						>
							<CompositeItem
								role="option"
								as="div"
								{ ...composite }
								className="block-editor-inserter__media-list__item"
								onClick={ () => onClick( block ) }
								aria-label={ title }
							>
								<div className="block-editor-inserter__media-list__item-preview">
									{ preview }
								</div>
							</CompositeItem>
							<MediaPreviewOptions
								category={ category }
								media={ media }
							/>
						</div>
					</Tooltip>
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

function MediaList( {
	mediaList,
	category,
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
			{ mediaList.map( ( media, index ) => (
				<MediaPreview
					key={ media.id || media.sourceId || index }
					media={ media }
					category={ category }
					onClick={ onPreviewClick }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
}

export default MediaList;
