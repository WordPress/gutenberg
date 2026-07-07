/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	SelectControl,
	ToggleControl,
	RangeControl,
	MenuGroup,
	MenuItem,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
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
import { useEffect, useMemo } from '@wordpress/element';
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

/**
 * Internal dependencies
 */
import { sharedIcon } from './shared-icon';
import { defaultColumnsNumber, pickRelevantMediaFiles } from './shared';
import { getHrefAndDestination } from './utils';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import {
	getUpdatedLinkTargetSettings,
	getImageSizeAttributes,
} from '../image/utils';
import Gallery from './gallery';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
	LINK_DESTINATION_LIGHTBOX,
	DEFAULT_MEDIA_SIZE_SLUG,
} from './constants';
import useImageSizes from './use-image-sizes';
import useGetNewImages from './use-get-new-images';
import useGetMedia from './use-get-media';
import GapStyles from './gap-styles';
import useDynamicGallery from './use-dynamic-gallery';
import { GallerySourcePanel, GalleryDynamicView } from './dynamic-gallery';
import { getDynamicSource, ATTACHED_MEDIA } from './dynamic-source';

const MAX_COLUMNS = 8;
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
const NAVIGATION_BUTTON_TYPE_OPTIONS = [
	{
		label: __( 'Icon' ),
		value: 'icon',
	},
	{
		label: __( 'Text' ),
		value: 'text',
	},
	{
		label: __( 'Both' ),
		value: 'both',
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
		isSelected,
		insertBlocksAfter,
		isContentLocked,
		context,
		__unstableLayoutClassNames: layoutClassNames,
	} = props;

	const postId = context?.postId;
	const postType = context?.postType;

	// Entering dynamic mode is a structural change (it discards inner blocks and
	// switches the block's mode), so the entry point is only offered when the
	// block is fully editable — mirroring the dynamic view's "Edit images"
	// toolbar control. Under a content lock the mode is `'contentOnly'`/
	// `'disabled'`, where structural affordances are hidden.
	const blockEditingMode = useBlockEditingMode();

	const [ lightboxSetting, defaultRatios, themeRatios, showDefaultRatios ] =
		useSettings(
			'blocks.core/image.lightbox',
			'dimensions.aspectRatios.default',
			'dimensions.aspectRatios.theme',
			'dimensions.defaultAspectRatios'
		);

	const linkOptions = ! lightboxSetting?.allowEditing
		? LINK_OPTIONS.filter(
				( option ) => option.value !== LINK_DESTINATION_LIGHTBOX
		  )
		: LINK_OPTIONS;

	const {
		align,
		navigationButtonType,
		columns,
		imageCrop,
		randomOrder,
		linkTarget,
		linkTo,
		sizeSlug,
		aspectRatio,
	} = attributes;

	const {
		__unstableMarkNextChangeAsNotPersistent,
		replaceInnerBlocks,
		updateBlockAttributes,
		selectBlock,
	} = useDispatch( blockEditorStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const { getBlock, getSettings, innerBlockImages, multiGallerySelection } =
		useSelect(
			( select ) => {
				const {
					getBlockName,
					getMultiSelectedBlockClientIds,
					getSettings: _getSettings,
					getBlock: _getBlock,
				} = select( blockEditorStore );
				const multiSelectedClientIds = getMultiSelectedBlockClientIds();

				return {
					getBlock: _getBlock,
					getSettings: _getSettings,
					innerBlockImages:
						_getBlock( clientId )?.innerBlocks ?? EMPTY_ARRAY,
					multiGallerySelection:
						multiSelectedClientIds.length &&
						multiSelectedClientIds.every(
							( _clientId ) =>
								getBlockName( _clientId ) === 'core/gallery'
						),
				};
			},
			[ clientId ]
		);

	const images = useMemo(
		() =>
			innerBlockImages?.map( ( block ) => ( {
				clientId: block.clientId,
				id: block.attributes.id,
				url: block.attributes.url,
				attributes: block.attributes,
				fromSavedContent: Boolean( block.originalContent ),
			} ) ),
		[ innerBlockImages ]
	);

	const imageData = useGetMedia( innerBlockImages );

	const newImages = useGetNewImages( images, imageData );

	const hasImages = !! images.length;
	const isDynamic = !! attributes.dynamicContent;

	// Dynamic mode (resolving images from a source instead of inner blocks):
	// source resolution, the editor-preview blocks, and the mode/ordering
	// actions.
	const dynamic = useDynamicGallery( {
		attributes,
		setAttributes,
		clientId,
		postId,
		postType,
	} );

	// State that drives counts/size options should reflect the dynamic media
	// when the gallery is in dynamic mode.
	const displayedImageCount = isDynamic
		? dynamic.dynamicMedia.length
		: images.length;

	// Check if there is at least one image with lightbox enabled. In dynamic
	// mode the images inherit the gallery's link setting, so the lightbox is on
	// when the gallery links images to the lightbox.
	let hasLightboxImages;
	if ( isDynamic ) {
		hasLightboxImages = linkTo === LINK_DESTINATION_LIGHTBOX;
	} else if ( lightboxSetting?.enabled ) {
		hasLightboxImages =
			images.filter(
				( image ) =>
					image.attributes?.lightbox?.enabled === undefined ||
					image.attributes?.lightbox?.enabled === true
			).length > 0;
	} else {
		hasLightboxImages =
			images.filter( ( image ) => image.attributes.lightbox?.enabled )
				.length > 0;
	}

	const themeOptions = themeRatios?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );
	const defaultOptions = defaultRatios?.map( ( { name, ratio } ) => ( {
		label: name,
		value: ratio,
	} ) );
	const aspectRatioOptions = [
		{
			label: _x(
				'Original',
				'Aspect ratio option for dimensions control'
			),
			value: 'auto',
		},
		...( showDefaultRatios ? defaultOptions || [] : [] ),
		...( themeOptions || [] ),
	];

	useEffect( () => {
		newImages?.forEach( ( newImage ) => {
			// Update the images data without creating new undo levels.
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( newImage.clientId, {
				...buildImageAttributes( newImage.attributes ),
				id: newImage.id,
				align: undefined,
			} );
		} );
	}, [ newImages ] );

	const imageSizeOptions = useImageSizes(
		isDynamic ? dynamic.dynamicMedia : imageData,
		isSelected,
		getSettings
	);

	/**
	 * Determines the image attributes that should be applied to an image block
	 * after the gallery updates.
	 *
	 * The gallery will receive the full collection of images when a new image
	 * is added. As a result we need to reapply the image's original settings if
	 * it already existed in the gallery. If the image is in fact new, we need
	 * to apply the gallery's current settings to the image.
	 *
	 * @param {Object} imageAttributes Media object for the actual image.
	 * @return {Object}                Attributes to set on the new image block.
	 */
	function buildImageAttributes( imageAttributes ) {
		const image = imageAttributes.id
			? imageData.find( ( { id } ) => id === imageAttributes.id )
			: null;

		let newClassName;
		if ( imageAttributes.className && imageAttributes.className !== '' ) {
			newClassName = imageAttributes.className;
		}

		let newLinkTarget;
		if ( imageAttributes.linkTarget || imageAttributes.rel ) {
			// When transformed from image blocks, the link destination and rel attributes are inherited.
			newLinkTarget = {
				linkTarget: imageAttributes.linkTarget,
				rel: imageAttributes.rel,
			};
		} else {
			// When an image is added, update the link destination and rel attributes according to the gallery settings
			newLinkTarget = getUpdatedLinkTargetSettings(
				linkTarget,
				attributes
			);
		}

		return {
			...pickRelevantMediaFiles( image, sizeSlug ),
			...getHrefAndDestination(
				image,
				linkTo,
				imageAttributes?.linkDestination
			),
			...newLinkTarget,
			className: newClassName,
			sizeSlug,
			caption:
				imageAttributes.caption.length > 0
					? imageAttributes.caption
					: image.caption?.raw,
			alt: imageAttributes.alt || image.alt_text,
			aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio,
		};
	}

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

		const imageArray = newFileUploads
			? Array.from( selectedImages ).map( ( file ) => {
					if ( ! file.url ) {
						return {
							blob: createBlobURL( file ),
						};
					}

					return file;
			  } )
			: selectedImages;

		if ( ! imageArray.every( isValidFileType ) ) {
			createErrorNotice(
				__(
					'If uploading to a gallery all files need to be image formats'
				),
				{ id: 'gallery-upload-invalid-file', type: 'snackbar' }
			);
		}

		const processedImages = imageArray
			.filter( ( file ) => file.url || isValidFileType( file ) )
			.map( ( file ) => {
				if ( ! file.url ) {
					return {
						blob: file.blob || createBlobURL( file ),
					};
				}

				return file;
			} );

		// Because we are reusing existing innerImage blocks any reordering
		// done in the media library will be lost so we need to reapply that ordering
		// once the new image blocks are merged in with existing.
		const newOrderMap = processedImages.reduce(
			( result, image, index ) => (
				( result[ image.id ] = index ), result
			),
			{}
		);

		const existingImageBlocks = ! newFileUploads
			? innerBlockImages.filter( ( block ) =>
					processedImages.find(
						( img ) => img.id === block.attributes.id
					)
			  )
			: innerBlockImages;

		const newImageList = processedImages.filter(
			( img ) =>
				! existingImageBlocks.find(
					( existingImg ) => img.id === existingImg.attributes.id
				)
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

	function setLinkTo( value ) {
		setAttributes( { linkTo: value } );
		const changedAttributes = {};
		const blocks = [];
		getBlock( clientId ).innerBlocks.forEach( ( block ) => {
			blocks.push( block.clientId );
			const image = block.attributes.id
				? imageData.find( ( { id } ) => id === block.attributes.id )
				: null;

			changedAttributes[ block.clientId ] = getHrefAndDestination(
				image,
				value,
				false,
				block.attributes,
				lightboxSetting
			);
		} );
		updateBlockAttributes( blocks, changedAttributes, {
			uniqueByBlock: true,
		} );
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

	function setColumnsNumber( value ) {
		setAttributes( { columns: value } );
	}

	function toggleImageCrop() {
		setAttributes( { imageCrop: ! imageCrop } );
	}

	function toggleRandomOrder() {
		setAttributes( { randomOrder: ! randomOrder } );
	}

	function toggleOpenInNewTab( openInNewTab ) {
		const newLinkTarget = openInNewTab ? '_blank' : undefined;
		setAttributes( { linkTarget: newLinkTarget } );
		const changedAttributes = {};
		const blocks = [];
		getBlock( clientId ).innerBlocks.forEach( ( block ) => {
			blocks.push( block.clientId );
			changedAttributes[ block.clientId ] = getUpdatedLinkTargetSettings(
				newLinkTarget,
				block.attributes
			);
		} );
		updateBlockAttributes( blocks, changedAttributes, {
			uniqueByBlock: true,
		} );
		const noticeText = openInNewTab
			? __( 'All gallery images updated to open in new tab' )
			: __( 'All gallery images updated to not open in new tab' );
		createSuccessNotice( noticeText, {
			id: 'gallery-attributes-openInNewTab',
			type: 'snackbar',
		} );
	}

	function updateImagesSize( newSizeSlug ) {
		setAttributes( { sizeSlug: newSizeSlug } );
		const changedAttributes = {};
		const blocks = [];
		getBlock( clientId ).innerBlocks.forEach( ( block ) => {
			blocks.push( block.clientId );
			const image = block.attributes.id
				? imageData.find( ( { id } ) => id === block.attributes.id )
				: null;
			changedAttributes[ block.clientId ] = getImageSizeAttributes(
				image,
				newSizeSlug
			);
		} );
		updateBlockAttributes( blocks, changedAttributes, {
			uniqueByBlock: true,
		} );
		const imageSize = imageSizeOptions.find(
			( size ) => size.value === newSizeSlug
		);

		createSuccessNotice(
			sprintf(
				/* translators: %s: image size settings */
				__( 'All gallery image sizes updated to: %s' ),
				imageSize?.label ?? newSizeSlug
			),
			{
				id: 'gallery-attributes-sizeSlug',
				type: 'snackbar',
			}
		);
	}

	function setAspectRatio( value ) {
		setAttributes( { aspectRatio: value } );

		// Update all inner image blocks with the new aspect ratio
		const changedAttributes = {};
		const blocks = [];

		getBlock( clientId ).innerBlocks.forEach( ( block ) => {
			blocks.push( block.clientId );
			changedAttributes[ block.clientId ] = {
				aspectRatio: value === 'auto' ? undefined : value,
			};
		} );

		updateBlockAttributes( blocks, changedAttributes, true );

		const aspectRatioText = aspectRatioOptions.find(
			( option ) => option.value === value
		);

		createSuccessNotice(
			sprintf(
				/* translators: %s: aspect ratio setting */
				__( 'All gallery images updated to aspect ratio: %s' ),
				aspectRatioText?.label || value
			),
			{
				id: 'gallery-attributes-aspectRatio',
				type: 'snackbar',
			}
		);
	}

	useEffect( () => {
		// linkTo attribute must be saved so blocks don't break when changing image_default_link_type in options.php.
		if ( ! linkTo ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				linkTo:
					window?.wp?.media?.view?.settings?.defaultProps?.link ||
					LINK_DESTINATION_NONE,
			} );
		}
	}, [ linkTo ] );

	const hasImageIds = hasImages && images.some( ( image ) => !! image.id );
	const imagesUploading = images.some(
		( img ) => ! img.id && img.url?.indexOf( 'blob:' ) === 0
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
			// In dynamic mode there are no inner blocks and the gallery isn't
			// rendered through the `Gallery` component, so the classes that
			// component normally composes onto the `<figure>` (see `gallery.js`)
			// must be added here to keep the preview's flex/crop layout matching
			// the static gallery and the frontend.
			isDynamic && [
				layoutClassNames,
				'blocks-gallery-grid',
				{
					[ `align${ align }` ]: align,
					[ `columns-${ columns }` ]: columns !== undefined,
					'columns-default': columns === undefined,
					'is-cropped': imageCrop,
				},
			]
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

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

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
					 * `dynamic-gallery.js`): even with no
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

	const hasLinkTo = linkTo && linkTo !== 'none';

	return (
		<>
			<InspectorControls>
				<GallerySourcePanel
					dynamic={ dynamic }
					dropdownMenuProps={ dropdownMenuProps }
					hasImages={ hasImages }
				/>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							navigationButtonType: 'icon',
							columns: undefined,
							imageCrop: true,
							randomOrder: false,
						} );

						setAspectRatio( 'auto' );

						if ( sizeSlug !== DEFAULT_MEDIA_SIZE_SLUG ) {
							updateImagesSize( DEFAULT_MEDIA_SIZE_SLUG );
						}

						if ( linkTarget ) {
							toggleOpenInNewTab( false );
						}
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					{ displayedImageCount > 1 && (
						<ToolsPanelItem
							isShownByDefault
							label={ __( 'Columns' ) }
							hasValue={ () =>
								!! columns && columns !== displayedImageCount
							}
							onDeselect={ () => setColumnsNumber( undefined ) }
						>
							<RangeControl
								label={ __( 'Columns' ) }
								value={
									columns
										? columns
										: defaultColumnsNumber(
												displayedImageCount
										  )
								}
								onChange={ setColumnsNumber }
								min={ 1 }
								max={ Math.min(
									MAX_COLUMNS,
									displayedImageCount
								) }
								required
							/>
						</ToolsPanelItem>
					) }
					{ imageSizeOptions?.length > 0 && (
						<ToolsPanelItem
							isShownByDefault
							label={ __( 'Resolution' ) }
							hasValue={ () =>
								sizeSlug !== DEFAULT_MEDIA_SIZE_SLUG
							}
							onDeselect={ () =>
								updateImagesSize( DEFAULT_MEDIA_SIZE_SLUG )
							}
						>
							<SelectControl
								label={ __( 'Resolution' ) }
								help={ __(
									'Select the size of the source images.'
								) }
								value={ sizeSlug }
								options={ imageSizeOptions }
								onChange={ updateImagesSize }
								hideCancelButton
							/>
						</ToolsPanelItem>
					) }
					<ToolsPanelItem
						isShownByDefault
						label={ __( 'Crop images to fit' ) }
						hasValue={ () => ! imageCrop }
						onDeselect={ () =>
							setAttributes( { imageCrop: true } )
						}
					>
						<ToggleControl
							label={ __( 'Crop images to fit' ) }
							checked={ !! imageCrop }
							onChange={ toggleImageCrop }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						isShownByDefault
						label={ __( 'Randomize order' ) }
						hasValue={ () => !! randomOrder }
						onDeselect={ () =>
							setAttributes( { randomOrder: false } )
						}
					>
						<ToggleControl
							label={ __( 'Randomize order' ) }
							checked={ !! randomOrder }
							onChange={ toggleRandomOrder }
						/>
					</ToolsPanelItem>
					{ hasLinkTo && (
						<ToolsPanelItem
							isShownByDefault
							label={ __( 'Open images in new tab' ) }
							hasValue={ () => !! linkTarget }
							onDeselect={ () => toggleOpenInNewTab( false ) }
						>
							<ToggleControl
								label={ __( 'Open images in new tab' ) }
								checked={ linkTarget === '_blank' }
								onChange={ toggleOpenInNewTab }
							/>
						</ToolsPanelItem>
					) }
					{ aspectRatioOptions.length > 1 && (
						<ToolsPanelItem
							hasValue={ () =>
								!! aspectRatio && aspectRatio !== 'auto'
							}
							label={ __( 'Aspect ratio' ) }
							onDeselect={ () => setAspectRatio( 'auto' ) }
							isShownByDefault
						>
							<SelectControl
								label={ __( 'Aspect ratio' ) }
								help={ __(
									'Set a consistent aspect ratio for all images in the gallery.'
								) }
								value={ aspectRatio }
								options={ aspectRatioOptions }
								onChange={ setAspectRatio }
							/>
						</ToolsPanelItem>
					) }
					{ lightboxSetting?.allowEditing && hasLightboxImages && (
						<ToolsPanelItem
							label={ __( 'Navigation button type' ) }
							isShownByDefault
							hasValue={ () => navigationButtonType !== 'icon' }
							onDeselect={ () =>
								setAttributes( {
									navigationButtonType: 'icon',
								} )
							}
						>
							<ToggleGroupControl
								label={ __( 'Navigation button type' ) }
								value={ navigationButtonType }
								onChange={ ( value ) =>
									setAttributes( {
										navigationButtonType: value,
									} )
								}
								isBlock
								help={ __(
									'Adjust the appearance of buttons in the lightbox.'
								) }
							>
								{ NAVIGATION_BUTTON_TYPE_OPTIONS.map(
									( option ) => (
										<ToggleGroupControlOption
											key={ option.value }
											value={ option.value }
											label={ option.label }
										/>
									)
								) }
							</ToggleGroupControl>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
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
			<>
				{ ! multiGallerySelection && ! isDynamic && (
					<BlockControls group="other">
						<MediaReplaceFlow
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							handleUpload={ false }
							onSelect={ updateImages }
							name={ __( 'Add' ) }
							multiple
							mediaIds={ images
								.filter( ( image ) => image.id )
								.map( ( image ) => image.id ) }
							addToGallery={ hasImageIds }
							variant="toolbar"
						/>
					</BlockControls>
				) }
				<GapStyles
					blockGap={ attributes.style?.spacing?.blockGap }
					clientId={ clientId }
				/>
			</>
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
					isContentLocked={ isContentLocked }
					images={ images }
					blockProps={ innerBlocksProps }
					insertBlocksAfter={ insertBlocksAfter }
					multiGallerySelection={ multiGallerySelection }
				/>
			) }
		</>
	);
}
