import clsx from 'clsx';
import {
	MenuGroup,
	MenuItem,
	ToolbarDropdownMenu,
	Button,
} from '@wordpress/components';
import {
	store as blockEditorStore,
	MediaPlaceholder,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	useBlockEditingMode,
	BlockControls,
	MediaReplaceFlow,
	useSettings,
} from '@wordpress/block-editor';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { createBlobURL } from '@wordpress/blob';
import { store as noticesStore } from '@wordpress/notices';
import {
	link as linkIcon,
	customLink,
	image as imageIcon,
	linkOff,
	fullscreen,
} from '@wordpress/icons';
import { sharedIcon } from './shared-icon';
import { getImageAttributes, isGalleryFlexLayout, isObject } from './shared';
import { getHrefAndDestination } from './utils';
import { getDefaultLinkDestination } from '../image/utils';
import Gallery from './gallery';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
	LINK_DESTINATION_LIGHTBOX,
} from './constants';
import useGetMedia from './use-get-media';
import useApplyGallerySettings from './use-apply-gallery-settings';
import GalleryStyles from './gallery-styles';
import GalleryControls from './controls';
import useDynamicGallery from './use-dynamic-gallery';
import { GallerySourcePanel, GalleryDynamicView } from './dynamic-gallery';
import { getDynamicSource, ATTACHED_MEDIA } from './dynamic-source';

const LINK_OPTIONS = [
	{
		icon: customLink,
		label: __( 'Link images to attachment pages' ),
		value: LINK_DESTINATION_ATTACHMENT,
		noticeText: __( 'Attachment Pages' ),
	},
	{
		icon: imageIcon,
		label: __( 'Link images to media files' ),
		value: LINK_DESTINATION_MEDIA,
		noticeText: __( 'Media Files' ),
	},
	{
		icon: fullscreen,
		label: __( 'Enlarge on click' ),
		value: LINK_DESTINATION_LIGHTBOX,
		noticeText: __( 'Lightbox effect' ),
		infoText: __( 'Scale images with a lightbox effect' ),
	},
	{
		icon: linkOff,
		label: _x( 'None', 'Media item link option' ),
		value: LINK_DESTINATION_NONE,
		noticeText: __( 'None' ),
	},
];
const ALLOWED_MEDIA_TYPES = [ 'image' ];

const PLACEHOLDER_TEXT = __(
	'Drag and drop images, upload, or choose from your library.'
);

const DEFAULT_BLOCK = { name: 'core/image' };
const EMPTY_ARRAY = [];

export default function GalleryEdit( props ) {
	const {
		setAttributes,
		attributes,
		className,
		clientId,
		insertBlocksAfter,
		context,
	} = props;

	const postId = context?.postId;
	const postType = context?.postType;

	// Entering dynamic mode is a structural change (it discards inner blocks and
	// switches the block's mode), so the entry point is only offered when the
	// block is fully editable — mirroring the dynamic view's "Edit images"
	// toolbar control. Under a content lock the mode is `'contentOnly'`/
	// `'disabled'`, where structural affordances are hidden.
	const blockEditingMode = useBlockEditingMode();

	const [ lightboxSetting ] = useSettings( 'blocks.core/image.lightbox' );

	const linkOptions = ! lightboxSetting?.allowEditing
		? LINK_OPTIONS.filter(
				( option ) => option.value !== LINK_DESTINATION_LIGHTBOX
			)
		: LINK_OPTIONS;

	const { layout } = attributes;
	const isDynamic = !! attributes.dynamicContent;
	// The site default only applies to images being added, which a dynamic
	// gallery never has, so match the server render.
	const linkTo =
		attributes.linkTo ??
		( isDynamic ? LINK_DESTINATION_NONE : getDefaultLinkDestination() );
	const galleryAttributes = { ...attributes, linkTo };
	const isFlexLayout = isGalleryFlexLayout( layout );
	const previousLayoutRef = useRef( layout );

	const { getBlocks } = useSelect( blockEditorStore );
	const {
		__unstableMarkNextChangeAsNotPersistent,
		replaceInnerBlocks,
		updateBlockAttributes,
		selectBlock,
	} = useDispatch( blockEditorStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	useEffect( () => {
		// Variations replace the whole layout object. Carry Grid-only settings
		// across a layout type change so switching back restores them.
		const previousLayout = previousLayoutRef.current;
		previousLayoutRef.current = layout;

		if (
			! isObject( previousLayout ) ||
			! isObject( layout ) ||
			previousLayout.type === layout.type
		) {
			return;
		}

		const nextLayout = { ...layout };
		let hasPreservedGridSetting = false;

		if (
			! Object.hasOwn( layout, 'columnCount' ) &&
			Number.isInteger( previousLayout.columnCount ) &&
			previousLayout.columnCount > 0
		) {
			nextLayout.columnCount = previousLayout.columnCount;
			hasPreservedGridSetting = true;
		}

		if (
			! Object.hasOwn( layout, 'minimumColumnWidth' ) &&
			typeof previousLayout.minimumColumnWidth === 'string'
		) {
			nextLayout.minimumColumnWidth = previousLayout.minimumColumnWidth;
			hasPreservedGridSetting = true;
		}

		if ( hasPreservedGridSetting ) {
			previousLayoutRef.current = nextLayout;
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { layout: nextLayout } );
		}
	}, [ layout, setAttributes, __unstableMarkNextChangeAsNotPersistent ] );

	const { innerBlockImages, multiGallerySelection, selectedStyleState } =
		useSelect(
			( select ) => {
				const {
					getBlockName,
					getMultiSelectedBlockClientIds,
					getBlocks: _getBlocks,
					getSelectedBlockStyleState,
				} = select( blockEditorStore );
				const multiSelectedClientIds = getMultiSelectedBlockClientIds();

				return {
					innerBlockImages: _getBlocks( clientId ),
					multiGallerySelection:
						multiSelectedClientIds.length &&
						multiSelectedClientIds.every(
							( _clientId ) =>
								getBlockName( _clientId ) === 'core/gallery'
						),
					selectedStyleState: getSelectedBlockStyleState( clientId ),
				};
			},
			[ clientId ]
		);
	const isViewportStyleState =
		selectedStyleState?.viewport &&
		selectedStyleState.viewport !== 'default';

	const imageData = useGetMedia( innerBlockImages );
	const mediaById = useMemo(
		() => new Map( imageData.map( ( media ) => [ media.id, media ] ) ),
		[ imageData ]
	);

	const hasImages = !! innerBlockImages.length;

	// The static "Order by" control shows the last sort applied from it, for as
	// long as the images stay in the sequence that sort produced. Any other
	// change to the images (a drag, an addition, a removal) drops it back to
	// "Custom"; it never reports an order the user didn't choose. Nothing is
	// stored, so this is local state rather than an attribute. It lives here,
	// not in the Settings panel, which unmounts when the block is deselected.
	const [ appliedSort, setAppliedSort ] = useState( null );

	// Dynamic mode (resolving images from a source instead of inner blocks):
	// source resolution, the editor-preview blocks, and the mode/ordering
	// actions.
	const dynamic = useDynamicGallery( {
		attributes: galleryAttributes,
		setAttributes,
		clientId,
		postId,
		postType,
	} );

	useApplyGallerySettings( innerBlockImages, mediaById, ( imageAttributes ) =>
		getImageAttributes(
			galleryAttributes,
			imageAttributes,
			mediaById.get( imageAttributes.id )
		)
	);

	function isValidFileType( file ) {
		const mediaTypeSelector = file.type;

		return (
			ALLOWED_MEDIA_TYPES.some(
				( mediaType ) => mediaTypeSelector?.indexOf( mediaType ) === 0
			) || file.blob
		);
	}

	function updateImages( selectedImages ) {
		const newFileUploads =
			Object.prototype.toString.call( selectedImages ) ===
			'[object FileList]';

		// Uploaded files become blobs before validation, so only picked or
		// dropped files can be rejected.
		const imageArray = Array.from( selectedImages, ( file ) =>
			file.url || ( ! newFileUploads && ! isValidFileType( file ) )
				? file
				: { blob: file.blob || createBlobURL( file ) }
		);

		if ( ! imageArray.every( isValidFileType ) ) {
			createErrorNotice(
				__(
					'If uploading to a gallery all files need to be image formats'
				),
				{ id: 'gallery-upload-invalid-file', type: 'snackbar' }
			);
		}

		const processedImages = imageArray.filter(
			( file ) => file.url || isValidFileType( file )
		);

		// Because we are reusing existing innerImage blocks any reordering
		// done in the media library will be lost so we need to reapply that ordering
		// once the new image blocks are merged in with existing.
		const newOrderMap = processedImages.reduce(
			( result, image, index ) => (
				( result[ image.id ] = index ),
				result
			 ),
			{}
		);

		const selectedIds = new Set( processedImages.map( ( img ) => img.id ) );
		const existingImageBlocks = ! newFileUploads
			? innerBlockImages.filter( ( block ) =>
					selectedIds.has( block.attributes.id )
				)
			: innerBlockImages;

		const existingIds = new Set(
			existingImageBlocks.map( ( block ) => block.attributes.id )
		);
		const newImageList = processedImages.filter(
			( img ) => ! existingIds.has( img.id )
		);

		const newBlocks = newImageList.map( ( image ) => {
			return createBlock( 'core/image', {
				id: image.id,
				blob: image.blob,
				url: image.url,
				caption: image.caption,
				alt: image.alt,
			} );
		} );

		replaceInnerBlocks(
			clientId,
			existingImageBlocks
				.concat( newBlocks )
				.sort(
					( a, b ) =>
						newOrderMap[ a.attributes.id ] -
						newOrderMap[ b.attributes.id ]
				)
		);

		// Select the first block to scroll into view when new blocks are added.
		if ( newBlocks?.length > 0 ) {
			selectBlock( newBlocks[ 0 ].clientId );
		}
	}

	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	function updateInnerImages( getAttributes ) {
		const images = getBlocks( clientId );
		updateBlockAttributes(
			images.map( ( block ) => block.clientId ),
			Object.fromEntries(
				images.map( ( block ) => [
					block.clientId,
					getAttributes(
						block,
						mediaById.get( block.attributes.id )
					),
				] )
			),
			{ uniqueByBlock: true }
		);
	}

	function setLinkTo( value ) {
		setAttributes( { linkTo: value } );
		updateInnerImages( ( block, media ) =>
			getHrefAndDestination(
				media,
				value,
				false,
				block.attributes,
				lightboxSetting
			)
		);
		const linkToText = [ ...linkOptions ].find(
			( linkType ) => linkType.value === value
		);

		createSuccessNotice(
			sprintf(
				/* translators: %s: image size settings */
				__( 'All gallery image links updated to: %s' ),
				linkToText.noticeText
			),
			{
				id: 'gallery-attributes-linkTo',
				type: 'snackbar',
			}
		);
	}

	const hasImageIds =
		hasImages &&
		innerBlockImages.some( ( block ) => !! block.attributes.id );
	const imagesUploading = innerBlockImages.some(
		( block ) =>
			! block.attributes.id &&
			block.attributes.url?.indexOf( 'blob:' ) === 0
	);

	const mediaPlaceholderProps = {
		addToGallery: false,
		disableMediaButtons: imagesUploading,
		value: {},
	};

	const blockProps = useBlockProps( {
		className: clsx(
			className,
			'has-nested-images',
			`wp-block-gallery-${ clientId }`
		),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,
		orientation: 'horizontal',
		renderAppender: false,
		// In dynamic mode nothing may be inserted: the images are resolved from
		// the source, not authored as inner blocks. `allowedBlocks: []` enforces
		// this in every context — unlike `templateLock: 'all'`, it isn't relaxed
		// to `contentOnly` by a content-locked ancestor — so it blocks insertion
		// and drag-and-drop (via `canInsertBlockType`). It's also what opts the
		// gallery out of the List View: a block that can't be inserted into and
		// has no inner blocks has nothing to navigate or add (see
		// `shouldRenderBlockListView`). This reaches the block's list settings
		// only while the inner blocks are mounted, which is why the dynamic view
		// still renders the (empty) inner blocks.
		allowedBlocks: isDynamic ? EMPTY_ARRAY : undefined,
	} );

	if ( ! hasImages && ! isDynamic ) {
		return (
			<div { ...innerBlocksProps }>
				{ innerBlocksProps.children }
				<MediaPlaceholder
					handleUpload={ false }
					icon={ sharedIcon }
					labels={ {
						title: __( 'Gallery' ),
						instructions: PLACEHOLDER_TEXT,
					} }
					onSelect={ updateImages }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					multiple
					onError={ onUploadError }
					{ ...mediaPlaceholderProps }
				>
					{ /*
					 * Entry into dynamic mode. Gated on the editing mode so it's
					 * hidden in content-only editing (where this structural change
					 * isn't allowed), but intentionally not hidden by
					 * `canUseDynamicSource` the way the inspector is (see
					 * `dynamic-gallery.jsx`): even with no
					 * post type to preview against, the source still resolves at
					 * render time via `get_the_ID()` (see `index.php`) — e.g. in a
					 * template part or pattern shown on a singular page.
					 */ }
					{ blockEditingMode === 'default' && (
						<Button
							__next40pxDefaultSize
							variant="secondary"
							onClick={ dynamic.enableDynamicMode }
						>
							{ getDynamicSource( ATTACHED_MEDIA ).title }
						</Button>
					) }
				</MediaPlaceholder>
			</div>
		);
	}

	return (
		<>
			<InspectorControls
				group={ isViewportStyleState ? 'style-state' : 'default' }
			>
				{ ! isViewportStyleState && (
					<GallerySourcePanel
						dynamic={ dynamic }
						hasImages={ hasImages }
					/>
				) }
				<GalleryControls
					attributes={ galleryAttributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
					viewport={
						isViewportStyleState
							? selectedStyleState.viewport
							: undefined
					}
					innerBlockImages={ innerBlockImages }
					mediaById={ mediaById }
					dynamic={ dynamic }
					updateInnerImages={ updateInnerImages }
					appliedSort={ appliedSort }
					setAppliedSort={ setAppliedSort }
				/>
			</InspectorControls>
			<BlockControls group="block">
				<ToolbarDropdownMenu icon={ linkIcon } label={ __( 'Link' ) }>
					{ ( { onClose } ) => (
						<MenuGroup>
							{ linkOptions.map( ( linkItem ) => {
								const isOptionSelected =
									linkTo === linkItem.value;
								return (
									<MenuItem
										key={ linkItem.value }
										isSelected={ isOptionSelected }
										className={ clsx(
											'components-dropdown-menu__menu-item',
											{
												'is-active': isOptionSelected,
											}
										) }
										iconPosition="left"
										icon={ linkItem.icon }
										onClick={ () => {
											setLinkTo( linkItem.value );
											onClose();
										} }
										role="menuitemradio"
										info={ linkItem.infoText }
									>
										{ linkItem.label }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					) }
				</ToolbarDropdownMenu>
			</BlockControls>
			{ ! multiGallerySelection && ! isDynamic && (
				<BlockControls group="other">
					<MediaReplaceFlow
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						handleUpload={ false }
						onSelect={ updateImages }
						name={ __( 'Add' ) }
						multiple
						mediaIds={ innerBlockImages
							.filter( ( block ) => block.attributes.id )
							.map( ( block ) => block.attributes.id ) }
						addToGallery={ hasImageIds }
						variant="toolbar"
					/>
				</BlockControls>
			) }
			<GalleryStyles
				style={ attributes.style }
				clientId={ clientId }
				isFlexLayout={ isFlexLayout }
			/>
			{ isDynamic ? (
				<GalleryDynamicView
					{ ...props }
					dynamic={ dynamic }
					blockProps={ blockProps }
					innerBlocksProps={ innerBlocksProps }
					multiGallerySelection={ multiGallerySelection }
				/>
			) : (
				<Gallery
					{ ...props }
					blockProps={ innerBlocksProps }
					insertBlocksAfter={ insertBlocksAfter }
					multiGallerySelection={ multiGallerySelection }
				>
					{ innerBlocksProps.children }
				</Gallery>
			) }
		</>
	);
}
