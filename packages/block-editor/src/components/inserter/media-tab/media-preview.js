/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__unstableCompositeItem as CompositeItem,
	Tooltip,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Spinner,
	Modal,
	Flex,
	FlexItem,
	Button,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useCallback, useState } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';
import { moreVertical, external } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import { getBlockAndPreviewFromMedia } from './utils';
import { store as blockEditorStore } from '../../../store';

const ALLOWED_MEDIA_TYPES = [ 'image' ];
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

function InsertExternalImageModal( { onClose, onSubmit } ) {
	return (
		<Modal
			title={ __( 'Insert external image' ) }
			onRequestClose={ onClose }
			className="block-editor-inserter-media-tab-media-preview-inserter-external-image-modal"
		>
			<VStack spacing={ 3 }>
				<p>
					{ __(
						'This image cannot be uploaded to your Media Library, but it can still be inserted as an external image.'
					) }
				</p>
				<p>
					{ __(
						'External images can be removed by the external provider without warning and could even have legal compliance issues related to privacy legislation.'
					) }
				</p>
			</VStack>
			<Flex
				className="block-editor-block-lock-modal__actions"
				justify="flex-end"
				expanded={ false }
			>
				<FlexItem>
					<Button variant="tertiary" onClick={ onClose }>
						{ __( 'Cancel' ) }
					</Button>
				</FlexItem>
				<FlexItem>
					<Button variant="primary" onClick={ onSubmit }>
						{ __( 'Insert' ) }
					</Button>
				</FlexItem>
			</Flex>
		</Modal>
	);
}

export function MediaPreview( { media, onClick, composite, category } ) {
	const [ showExternalUploadModal, setShowExternalUploadModal ] =
		useState( false );
	const [ isHovered, setIsHovered ] = useState( false );
	const [ isInserting, setIsInserting ] = useState( false );
	const [ block, preview ] = useMemo(
		() => getBlockAndPreviewFromMedia( media, category.mediaType ),
		[ media, category.mediaType ]
	);
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const mediaUpload = useSelect(
		( select ) => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);
	const onMediaInsert = useCallback(
		( previewBlock ) => {
			// Prevent multiple uploads when we're in the process of inserting.
			if ( isInserting ) {
				return;
			}
			const clonedBlock = cloneBlock( previewBlock );
			const { id, url, caption } = clonedBlock.attributes;
			// Media item already exists in library, so just insert it.
			if ( !! id ) {
				onClick( clonedBlock );
				return;
			}
			setIsInserting( true );
			// Media item does not exist in library, so try to upload it.
			// Fist fetch the image data. This may fail if the image host
			// doesn't allow CORS with the domain.
			// If this happens, we insert the image block using the external
			// URL and let the user know about the possible implications.
			window
				.fetch( url )
				.then( ( response ) => response.blob() )
				.then( ( blob ) => {
					mediaUpload( {
						filesList: [ blob ],
						additionalData: { caption },
						onFileChange( [ img ] ) {
							if ( isBlobURL( img.url ) ) {
								return;
							}
							onClick( {
								...clonedBlock,
								attributes: {
									...clonedBlock.attributes,
									id: img.id,
									url: img.url,
								},
							} );
							createSuccessNotice(
								__( 'Image uploaded and inserted.' ),
								{ type: 'snackbar' }
							);
							setIsInserting( false );
						},
						allowedTypes: ALLOWED_MEDIA_TYPES,
						onError( message ) {
							createErrorNotice( message, { type: 'snackbar' } );
							setIsInserting( false );
						},
					} );
				} )
				.catch( () => {
					setShowExternalUploadModal( true );
					setIsInserting( false );
				} );
		},
		[
			isInserting,
			onClick,
			mediaUpload,
			createErrorNotice,
			createSuccessNotice,
		]
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
		<>
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
									onClick={ () => onMediaInsert( block ) }
									aria-label={ title }
								>
									<div className="block-editor-inserter__media-list__item-preview">
										{ preview }
										{ isInserting && (
											<div className="block-editor-inserter__media-list__item-preview-spinner">
												<Spinner />
											</div>
										) }
									</div>
								</CompositeItem>
								{ ! isInserting && (
									<MediaPreviewOptions
										category={ category }
										media={ media }
									/>
								) }
							</div>
						</Tooltip>
					</div>
				) }
			</InserterDraggableBlocks>
			{ showExternalUploadModal && (
				<InsertExternalImageModal
					onClose={ () => setShowExternalUploadModal( false ) }
					onSubmit={ () => {
						onClick( cloneBlock( block ) );
						createSuccessNotice( __( 'Image inserted.' ), {
							type: 'snackbar',
						} );
						setShowExternalUploadModal( false );
					} }
				/>
			) }
		</>
	);
}
