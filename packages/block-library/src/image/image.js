/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import {
	ExternalLink,
	ResizableBox,
	Spinner,
	TextareaControl,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUseCustomUnits as useCustomUnits,
	Placeholder,
	MenuItem,
	ToolbarItem,
	DropdownMenu,
	Popover,
} from '@wordpress/components';
import {
	useMergeRefs,
	useResizeObserver,
	useViewportMatch,
} from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockControls,
	InspectorControls,
	__experimentalImageURLInputUI as ImageURLInputUI,
	MediaReplaceFlow,
	store as blockEditorStore,
	useSettings,
	__experimentalImageEditor as ImageEditor,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
	privateApis as blockEditorPrivateApis,
	BlockSettingsMenuControls,
} from '@wordpress/block-editor';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _x, sprintf, isRTL } from '@wordpress/i18n';
import { getFilename } from '@wordpress/url';
import { getBlockBindingsSource, switchToBlockType } from '@wordpress/blocks';
import { crop, overlayText, upload, chevronDown } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { createUpgradedEmbedBlock } from '../embed/util';
import { isExternalImage } from './edit';
import { Caption } from '../utils/caption';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import {
	MIN_SIZE,
	ALLOWED_MEDIA_TYPES,
	SIZED_LAYOUTS,
	DEFAULT_MEDIA_SIZE_SLUG,
} from './constants';
import { evalAspectRatio } from './utils';

const { DimensionsTool, ResolutionTool } = unlock( blockEditorPrivateApis );

const scaleOptions = [
	{
		value: 'cover',
		label: _x( 'Cover', 'Scale option for dimensions control' ),
		help: __( 'Image covers the space evenly.' ),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for dimensions control' ),
		help: __( 'Image is contained without distortion.' ),
	},
];

const WRITEMODE_POPOVER_PROPS = {
	placement: 'bottom-start',
};

// If the image has a href, wrap in an <a /> tag to trigger any inherited link element styles.
const ImageWrapper = ( { href, children } ) => {
	if ( ! href ) {
		return children;
	}
	return (
		<a
			href={ href }
			onClick={ ( event ) => event.preventDefault() }
			aria-disabled
			style={ {
				// When the Image block is linked,
				// it's wrapped with a disabled <a /> tag.
				// Restore cursor style so it doesn't appear 'clickable'
				// and remove pointer events. Safari needs the display property.
				pointerEvents: 'none',
				cursor: 'default',
				display: 'inline',
			} }
		>
			{ children }
		</a>
	);
};

function ContentOnlyControls( {
	attributes,
	setAttributes,
	lockAltControls,
	lockAltControlsMessage,
	lockTitleControls,
	lockTitleControlsMessage,
} ) {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const [ isAltDialogOpen, setIsAltDialogOpen ] = useState( false );
	const [ isTitleDialogOpen, setIsTitleDialogOpen ] = useState( false );
	return (
		<>
			<ToolbarItem ref={ setPopoverAnchor }>
				{ ( toggleProps ) => (
					<DropdownMenu
						icon={ chevronDown }
						/* translators: button label text should, if possible, be under 16 characters. */
						label={ __( 'More' ) }
						toggleProps={ {
							...toggleProps,
							description: __( 'Displays more controls.' ),
						} }
						popoverProps={ WRITEMODE_POPOVER_PROPS }
					>
						{ ( { onClose } ) => (
							<>
								<MenuItem
									onClick={ () => {
										setIsAltDialogOpen( true );
										onClose();
									} }
									aria-haspopup="dialog"
								>
									{ _x(
										'Alternative text',
										'Alternative text for an image. Block toolbar label, a low character count is preferred.'
									) }
								</MenuItem>
								<MenuItem
									onClick={ () => {
										setIsTitleDialogOpen( true );
										onClose();
									} }
									aria-haspopup="dialog"
								>
									{ __( 'Title text' ) }
								</MenuItem>
							</>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
			{ isAltDialogOpen && (
				<Popover
					placement="bottom-start"
					anchor={ popoverAnchor }
					onClose={ () => setIsAltDialogOpen( false ) }
					offset={ 13 }
					variant="toolbar"
				>
					<div className="wp-block-image__toolbar_content_textarea__container">
						<TextareaControl
							className="wp-block-image__toolbar_content_textarea"
							label={ __( 'Alternative text' ) }
							value={ attributes.alt || '' }
							onChange={ ( value ) =>
								setAttributes( { alt: value } )
							}
							disabled={ lockAltControls }
							help={
								lockAltControls ? (
									<>{ lockAltControlsMessage }</>
								) : (
									<>
										<ExternalLink
											href={
												// translators: Localized tutorial, if one exists. W3C Web Accessibility Initiative link has list of existing translations.
												__(
													'https://www.w3.org/WAI/tutorials/images/decision-tree/'
												)
											}
										>
											{ __(
												'Describe the purpose of the image.'
											) }
										</ExternalLink>
										<br />
										{ __( 'Leave empty if decorative.' ) }
									</>
								)
							}
						/>
					</div>
				</Popover>
			) }
			{ isTitleDialogOpen && (
				<Popover
					placement="bottom-start"
					anchor={ popoverAnchor }
					onClose={ () => setIsTitleDialogOpen( false ) }
					offset={ 13 }
					variant="toolbar"
				>
					<div className="wp-block-image__toolbar_content_textarea__container">
						<TextControl
							__next40pxDefaultSize
							className="wp-block-image__toolbar_content_textarea"
							label={ __( 'Title attribute' ) }
							value={ attributes.title || '' }
							onChange={ ( value ) =>
								setAttributes( {
									title: value,
								} )
							}
							disabled={ lockTitleControls }
							help={
								lockTitleControls ? (
									<>{ lockTitleControlsMessage }</>
								) : (
									<>
										{ __(
											'Describe the role of this image on the page.'
										) }
										<ExternalLink href="https://www.w3.org/TR/html52/dom.html#the-title-attribute">
											{ __(
												'(Note: many devices and browsers do not display this text.)'
											) }
										</ExternalLink>
									</>
								)
							}
						/>
					</div>
				</Popover>
			) }
		</>
	);
}

export default function Image( {
	temporaryURL,
	attributes,
	setAttributes,
	isSingleSelected,
	insertBlocksAfter,
	onReplace,
	onSelectImage,
	onSelectURL,
	onUploadError,
	context,
	clientId,
	blockEditingMode,
	parentLayoutType,
	maxContentWidth,
} ) {
	const {
		url = '',
		alt,
		align,
		id,
		href,
		rel,
		linkClass,
		linkDestination,
		title,
		width,
		height,
		aspectRatio,
		scale,
		linkTarget,
		sizeSlug,
		lightbox,
		metadata,
	} = attributes;
	const [ imageElement, setImageElement ] = useState();
	const [ resizeDelta, setResizeDelta ] = useState( null );
	const [ pixelSize, setPixelSize ] = useState( {} );
	const [ offsetTop, setOffsetTop ] = useState( 0 );
	const setResizeObserved = useResizeObserver( ( [ entry ] ) => {
		if ( ! resizeDelta ) {
			const [ box ] = entry.borderBoxSize;
			setPixelSize( { width: box.inlineSize, height: box.blockSize } );
		}
		// This is usually 0 unless the image height is less than the line-height.
		setOffsetTop( entry.target.offsetTop );
	} );
	const effectResizeableBoxPlacement = useCallback( () => {
		setOffsetTop( imageElement?.offsetTop ?? 0 );
	}, [ imageElement ] );
	const setRefs = useMergeRefs( [ setImageElement, setResizeObserved ] );
	const { allowResize = true } = context;

	const image = useSelect(
		( select ) =>
			id && isSingleSelected
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						id,
						{ context: 'view' }
				  )
				: null,
		[ id, isSingleSelected ]
	);

	const { canInsertCover, imageEditing, imageSizes, maxWidth } = useSelect(
		( select ) => {
			const { getBlockRootClientId, canInsertBlockType, getSettings } =
				select( blockEditorStore );

			const rootClientId = getBlockRootClientId( clientId );
			const settings = getSettings();

			return {
				imageEditing: settings.imageEditing,
				imageSizes: settings.imageSizes,
				maxWidth: settings.maxWidth,
				canInsertCover: canInsertBlockType(
					'core/cover',
					rootClientId
				),
			};
		},
		[ clientId ]
	);
	const { getBlock, getSettings } = useSelect( blockEditorStore );

	const { replaceBlocks, toggleSelection } = useDispatch( blockEditorStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const { editEntityRecord } = useDispatch( coreStore );

	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideAligned = [ 'wide', 'full' ].includes( align );
	const [
		{ loadedNaturalWidth, loadedNaturalHeight },
		setLoadedNaturalSize,
	] = useState( {} );
	const [ isEditingImage, setIsEditingImage ] = useState( false );
	const [ externalBlob, setExternalBlob ] = useState();
	const [ hasImageErrored, setHasImageErrored ] = useState( false );
	const hasNonContentControls = blockEditingMode === 'default';
	const isContentOnlyMode = blockEditingMode === 'contentOnly';
	const isResizable =
		allowResize &&
		hasNonContentControls &&
		! isWideAligned &&
		isLargeViewport;
	const imageSizeOptions = imageSizes
		.filter(
			( { slug } ) => image?.media_details?.sizes?.[ slug ]?.source_url
		)
		.map( ( { name, slug } ) => ( { value: slug, label: name } ) );

	// If an image is externally hosted, try to fetch the image data. This may
	// fail if the image host doesn't allow CORS with the domain. If it works,
	// we can enable a button in the toolbar to upload the image.
	useEffect( () => {
		if (
			! isExternalImage( id, url ) ||
			! isSingleSelected ||
			! getSettings().mediaUpload
		) {
			setExternalBlob();
			return;
		}

		if ( externalBlob ) {
			return;
		}

		window
			// Avoid cache, which seems to help avoid CORS problems.
			.fetch( url.includes( '?' ) ? url : url + '?' )
			.then( ( response ) => response.blob() )
			.then( ( blob ) => setExternalBlob( blob ) )
			// Do nothing, cannot upload.
			.catch( () => {} );
	}, [ id, url, isSingleSelected, externalBlob, getSettings ] );

	// Get naturalWidth and naturalHeight from image, and fall back to loaded natural
	// width and height. This resolves an issue in Safari where the loaded natural
	// width and height is otherwise lost when switching between alignments.
	// See: https://github.com/WordPress/gutenberg/pull/37210.
	const { naturalWidth, naturalHeight } = useMemo( () => {
		return {
			naturalWidth:
				imageElement?.naturalWidth || loadedNaturalWidth || undefined,
			naturalHeight:
				imageElement?.naturalHeight || loadedNaturalHeight || undefined,
		};
	}, [ loadedNaturalWidth, loadedNaturalHeight, imageElement?.complete ] );

	function onImageError() {
		setHasImageErrored( true );

		// Check if there's an embed block that handles this URL, e.g., instagram URL.
		// See: https://github.com/WordPress/gutenberg/pull/11472
		const embedBlock = createUpgradedEmbedBlock( { attributes: { url } } );
		if ( undefined !== embedBlock ) {
			onReplace( embedBlock );
		}
	}

	function onImageLoad( event ) {
		setHasImageErrored( false );
		setLoadedNaturalSize( {
			loadedNaturalWidth: event.target?.naturalWidth,
			loadedNaturalHeight: event.target?.naturalHeight,
		} );
	}

	function onSetHref( props ) {
		setAttributes( props );
	}

	function onSetLightbox( enable ) {
		if ( enable && ! lightboxSetting?.enabled ) {
			setAttributes( {
				lightbox: { enabled: true },
			} );
		} else if ( ! enable && lightboxSetting?.enabled ) {
			setAttributes( {
				lightbox: { enabled: false },
			} );
		} else {
			setAttributes( {
				lightbox: undefined,
			} );
		}
	}

	function resetLightbox() {
		// When deleting a link from an image while lightbox settings
		// are enabled by default, we should disable the lightbox,
		// otherwise the resulting UX looks like a mistake.
		// See https://github.com/WordPress/gutenberg/pull/59890/files#r1532286123.
		if ( lightboxSetting?.enabled && lightboxSetting?.allowEditing ) {
			setAttributes( {
				lightbox: { enabled: false },
			} );
		} else {
			setAttributes( {
				lightbox: undefined,
			} );
		}
	}

	function onSetTitle( value ) {
		// This is the HTML title attribute, separate from the media object
		// title.
		setAttributes( { title: value } );
	}

	function updateAlt( newAlt ) {
		setAttributes( { alt: newAlt } );
	}

	function updateImage( newSizeSlug ) {
		const newUrl = image?.media_details?.sizes?.[ newSizeSlug ]?.source_url;
		if ( ! newUrl ) {
			return null;
		}

		setAttributes( {
			url: newUrl,
			sizeSlug: newSizeSlug,
		} );
	}

	function uploadExternal() {
		const { mediaUpload } = getSettings();
		if ( ! mediaUpload ) {
			return;
		}
		mediaUpload( {
			filesList: [ externalBlob ],
			onFileChange( [ img ] ) {
				onSelectImage( img );

				if ( isBlobURL( img.url ) ) {
					return;
				}

				setExternalBlob();
				createSuccessNotice( __( 'Image uploaded.' ), {
					type: 'snackbar',
				} );
			},
			allowedTypes: ALLOWED_MEDIA_TYPES,
			onError( message ) {
				createErrorNotice( message, { type: 'snackbar' } );
			},
		} );
	}

	useEffect( () => {
		if ( ! isSingleSelected ) {
			setIsEditingImage( false );
		}
	}, [ isSingleSelected ] );

	const canEditImage = id && naturalWidth && naturalHeight && imageEditing;
	const allowCrop =
		isSingleSelected &&
		canEditImage &&
		! isEditingImage &&
		! isContentOnlyMode;

	function switchToCover() {
		replaceBlocks(
			clientId,
			switchToBlockType( getBlock( clientId ), 'core/cover' )
		);
	}

	// TODO: Can allow more units after figuring out how they should interact
	// with the ResizableBox and ImageEditor components. Calculations later on
	// for those components are currently assuming px units.
	const dimensionsUnitsOptions = useCustomUnits( {
		availableUnits: [ 'px' ],
	} );

	const [ lightboxSetting ] = useSettings( 'lightbox' );

	const showLightboxSetting =
		// If a block-level override is set, we should give users the option to
		// remove that override, even if the lightbox UI is disabled in the settings.
		( !! lightbox && lightbox?.enabled !== lightboxSetting?.enabled ) ||
		lightboxSetting?.allowEditing;

	const lightboxChecked =
		!! lightbox?.enabled || ( ! lightbox && !! lightboxSetting?.enabled );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const dimensionsControl =
		isResizable &&
		( SIZED_LAYOUTS.includes( parentLayoutType ) ? (
			<DimensionsTool
				value={ { aspectRatio } }
				onChange={ ( { aspectRatio: newAspectRatio } ) => {
					setAttributes( {
						aspectRatio: newAspectRatio,
						scale: 'cover',
					} );
				} }
				defaultAspectRatio="auto"
				tools={ [ 'aspectRatio' ] }
			/>
		) : (
			<DimensionsTool
				value={ { width, height, scale, aspectRatio } }
				onChange={ ( {
					width: newWidth,
					height: newHeight,
					scale: newScale,
					aspectRatio: newAspectRatio,
				} ) => {
					// Rebuilding the object forces setting `undefined`
					// for values that are removed since setAttributes
					// doesn't do anything with keys that aren't set.
					setAttributes( {
						// CSS includes `height: auto`, but we need
						// `width: auto` to fix the aspect ratio when
						// only height is set due to the width and
						// height attributes set via the server.
						width: ! newWidth && newHeight ? 'auto' : newWidth,
						height: newHeight,
						scale: newScale,
						aspectRatio: newAspectRatio,
					} );
				} }
				defaultScale="cover"
				defaultAspectRatio="auto"
				scaleOptions={ scaleOptions }
				unitsOptions={ dimensionsUnitsOptions }
			/>
		) );

	const resetAll = () => {
		setAttributes( {
			alt: undefined,
			width: undefined,
			height: undefined,
			scale: undefined,
			aspectRatio: undefined,
			lightbox: undefined,
		} );
		updateImage( DEFAULT_MEDIA_SIZE_SLUG );
	};

	const sizeControls = (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ resetAll }
				dropdownMenuProps={ dropdownMenuProps }
			>
				{ dimensionsControl }
			</ToolsPanel>
		</InspectorControls>
	);

	const arePatternOverridesEnabled =
		metadata?.bindings?.__default?.source === 'core/pattern-overrides';

	const {
		lockUrlControls = false,
		lockHrefControls = false,
		lockAltControls = false,
		lockAltControlsMessage,
		lockTitleControls = false,
		lockTitleControlsMessage,
		hideCaptionControls = false,
	} = useSelect(
		( select ) => {
			if ( ! isSingleSelected ) {
				return {};
			}
			const {
				url: urlBinding,
				alt: altBinding,
				title: titleBinding,
				caption: captionBinding,
			} = metadata?.bindings || {};
			const hasParentPattern = !! context[ 'pattern/overrides' ];
			const urlBindingSource = getBlockBindingsSource(
				urlBinding?.source
			);
			const altBindingSource = getBlockBindingsSource(
				altBinding?.source
			);
			const titleBindingSource = getBlockBindingsSource(
				titleBinding?.source
			);
			return {
				lockUrlControls:
					!! urlBinding &&
					! urlBindingSource?.canUserEditValue?.( {
						select,
						context,
						args: urlBinding?.args,
					} ),
				lockHrefControls:
					// Disable editing the link of the URL if the image is inside a pattern instance.
					// This is a temporary solution until we support overriding the link on the frontend.
					hasParentPattern || arePatternOverridesEnabled,
				hideCaptionControls: !! captionBinding,
				lockAltControls:
					!! altBinding &&
					! altBindingSource?.canUserEditValue?.( {
						select,
						context,
						args: altBinding?.args,
					} ),
				lockAltControlsMessage: altBindingSource?.label
					? sprintf(
							/* translators: %s: Label of the bindings source. */
							__( 'Connected to %s' ),
							altBindingSource.label
					  )
					: __( 'Connected to dynamic data' ),
				lockTitleControls:
					!! titleBinding &&
					! titleBindingSource?.canUserEditValue?.( {
						select,
						context,
						args: titleBinding?.args,
					} ),
				lockTitleControlsMessage: titleBindingSource?.label
					? sprintf(
							/* translators: %s: Label of the bindings source. */
							__( 'Connected to %s' ),
							titleBindingSource.label
					  )
					: __( 'Connected to dynamic data' ),
			};
		},
		[
			arePatternOverridesEnabled,
			context,
			isSingleSelected,
			metadata?.bindings,
		]
	);

	const showUrlInput =
		isSingleSelected &&
		! isEditingImage &&
		! lockHrefControls &&
		! lockUrlControls;

	const showCoverControls =
		isSingleSelected && canInsertCover && ! isContentOnlyMode;

	const showBlockControls = showUrlInput || allowCrop || showCoverControls;

	const mediaReplaceFlow = isSingleSelected &&
		! isEditingImage &&
		! lockUrlControls && (
			// For contentOnly mode, put this button in its own area so it has borders around it.
			<BlockControls group={ isContentOnlyMode ? 'inline' : 'other' }>
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ url }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					onSelect={ onSelectImage }
					onSelectURL={ onSelectURL }
					onError={ onUploadError }
					name={ ! url ? __( 'Add image' ) : __( 'Replace' ) }
					onReset={ () => onSelectImage( undefined ) }
				/>
			</BlockControls>
		);

	const controls = (
		<>
			{ showBlockControls && (
				<BlockControls group="block">
					{ showUrlInput && (
						<ImageURLInputUI
							url={ href || '' }
							onChangeUrl={ onSetHref }
							linkDestination={ linkDestination }
							mediaUrl={ ( image && image.source_url ) || url }
							mediaLink={ image && image.link }
							linkTarget={ linkTarget }
							linkClass={ linkClass }
							rel={ rel }
							showLightboxSetting={ showLightboxSetting }
							lightboxEnabled={ lightboxChecked }
							onSetLightbox={ onSetLightbox }
							resetLightbox={ resetLightbox }
						/>
					) }
					{ allowCrop && (
						<ToolbarButton
							onClick={ () => setIsEditingImage( true ) }
							icon={ crop }
							label={ __( 'Crop' ) }
						/>
					) }
					{ showCoverControls && (
						<ToolbarButton
							icon={ overlayText }
							label={ __( 'Add text over image' ) }
							onClick={ switchToCover }
						/>
					) }
				</BlockControls>
			) }
			{ isSingleSelected && externalBlob && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							onClick={ uploadExternal }
							icon={ upload }
							label={ __( 'Upload to Media Library' ) }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			{ isContentOnlyMode && (
				// Add some extra controls for content attributes when content only mode is active.
				// With content only mode active, the inspector is hidden, so users need another way
				// to edit these attributes.
				<BlockControls group="block">
					<ContentOnlyControls
						attributes={ attributes }
						setAttributes={ setAttributes }
						lockAltControls={ lockAltControls }
						lockAltControlsMessage={ lockAltControlsMessage }
						lockTitleControls={ lockTitleControls }
						lockTitleControlsMessage={ lockTitleControlsMessage }
					/>
				</BlockControls>
			) }
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ resetAll }
					dropdownMenuProps={ dropdownMenuProps }
				>
					{ isSingleSelected && (
						<ToolsPanelItem
							label={ __( 'Alternative text' ) }
							isShownByDefault
							hasValue={ () => !! alt }
							onDeselect={ () =>
								setAttributes( { alt: undefined } )
							}
						>
							<TextareaControl
								label={ __( 'Alternative text' ) }
								value={ alt || '' }
								onChange={ updateAlt }
								readOnly={ lockAltControls }
								help={
									lockAltControls ? (
										<>{ lockAltControlsMessage }</>
									) : (
										<>
											<ExternalLink
												href={
													// translators: Localized tutorial, if one exists. W3C Web Accessibility Initiative link has list of existing translations.
													__(
														'https://www.w3.org/WAI/tutorials/images/decision-tree/'
													)
												}
											>
												{ __(
													'Describe the purpose of the image.'
												) }
											</ExternalLink>
											<br />
											{ __(
												'Leave empty if decorative.'
											) }
										</>
									)
								}
							/>
						</ToolsPanelItem>
					) }
					{ dimensionsControl }
					{ !! imageSizeOptions.length && (
						<ResolutionTool
							value={ sizeSlug }
							defaultValue={ DEFAULT_MEDIA_SIZE_SLUG }
							onChange={ updateImage }
							options={ imageSizeOptions }
						/>
					) }
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="advanced">
				<TextControl
					__next40pxDefaultSize
					label={ __( 'Title attribute' ) }
					value={ title || '' }
					onChange={ onSetTitle }
					readOnly={ lockTitleControls }
					help={
						lockTitleControls ? (
							<>{ lockTitleControlsMessage }</>
						) : (
							<>
								{ __(
									'Describe the role of this image on the page.'
								) }
								<ExternalLink href="https://www.w3.org/TR/html52/dom.html#the-title-attribute">
									{ __(
										'(Note: many devices and browsers do not display this text.)'
									) }
								</ExternalLink>
							</>
						)
					}
				/>
			</InspectorControls>
		</>
	);

	const filename = getFilename( url );
	let defaultedAlt;

	if ( alt ) {
		defaultedAlt = alt;
	} else if ( filename ) {
		defaultedAlt = sprintf(
			/* translators: %s: file name */
			__( 'This image has an empty alt attribute; its file name is %s' ),
			filename
		);
	} else {
		defaultedAlt = __( 'This image has an empty alt attribute' );
	}

	const borderProps = useBorderProps( attributes );
	const shadowProps = getShadowClassesAndStyles( attributes );
	const isRounded = attributes.className?.includes( 'is-style-rounded' );

	const { postType, postId, queryId } = context;
	const isDescendentOfQueryLoop = Number.isFinite( queryId );

	let img =
		temporaryURL && hasImageErrored ? (
			// Show a placeholder during upload when the blob URL can't be loaded. This can
			// happen when the user uploads a HEIC image in a browser that doesn't support them.
			<Placeholder
				className="wp-block-image__placeholder"
				withIllustration
			>
				<Spinner />
			</Placeholder>
		) : (
			<>
				<img
					src={ temporaryURL || url }
					alt={ defaultedAlt }
					onError={ onImageError }
					onLoad={ onImageLoad }
					ref={ setRefs }
					className={ borderProps.className }
					width={ naturalWidth }
					height={ naturalHeight }
					style={ {
						aspectRatio,
						...( resizeDelta
							? {
									width: pixelSize.width + resizeDelta.width,
									height:
										pixelSize.height + resizeDelta.height,
							  }
							: { width, height } ),
						objectFit: scale,
						...borderProps.style,
						...shadowProps.style,
					} }
				/>
				{ temporaryURL && <Spinner /> }
			</>
		);

	if ( canEditImage && isEditingImage ) {
		img = (
			<ImageWrapper href={ href }>
				<ImageEditor
					id={ id }
					url={ url }
					{ ...pixelSize }
					naturalHeight={ naturalHeight }
					naturalWidth={ naturalWidth }
					onSaveImage={ ( imageAttributes ) =>
						setAttributes( imageAttributes )
					}
					onFinishEditing={ () => {
						setIsEditingImage( false );
					} }
					borderProps={ isRounded ? undefined : borderProps }
				/>
			</ImageWrapper>
		);
	} else {
		img = <ImageWrapper href={ href }>{ img }</ImageWrapper>;
	}

	let resizableBox;
	if (
		isResizable &&
		isSingleSelected &&
		! isEditingImage &&
		! SIZED_LAYOUTS.includes( parentLayoutType )
	) {
		const numericRatio = aspectRatio && evalAspectRatio( aspectRatio );
		const customRatio = pixelSize.width / pixelSize.height;
		const naturalRatio = naturalWidth / naturalHeight;
		const ratio = numericRatio || customRatio || naturalRatio || 1;
		const minWidth =
			naturalWidth < naturalHeight ? MIN_SIZE : MIN_SIZE * ratio;
		const minHeight =
			naturalHeight < naturalWidth ? MIN_SIZE : MIN_SIZE / ratio;

		// With the current implementation of ResizableBox, an image needs an
		// explicit pixel value for the max-width. In absence of being able to
		// set the content-width, this max-width is currently dictated by the
		// vanilla editor style. The following variable adds a buffer to this
		// vanilla style, so 3rd party themes have some wiggleroom. This does,
		// in most cases, allow you to scale the image beyond the width of the
		// main column, though not infinitely.
		// @todo It would be good to revisit this once a content-width variable
		// becomes available.
		const maxWidthBuffer = maxWidth * 2.5;
		const maxResizeWidth = maxContentWidth || maxWidthBuffer;

		let showRightHandle = false;
		let showLeftHandle = false;

		/* eslint-disable no-lonely-if */
		// See https://github.com/WordPress/gutenberg/issues/7584.
		if ( align === 'center' ) {
			// When the image is centered, show both handles.
			showRightHandle = true;
			showLeftHandle = true;
		} else if ( isRTL() ) {
			// In RTL mode the image is on the right by default.
			// Show the right handle and hide the left handle only when it is
			// aligned left. Otherwise always show the left handle.
			if ( align === 'left' ) {
				showRightHandle = true;
			} else {
				showLeftHandle = true;
			}
		} else {
			// Show the left handle and hide the right handle only when the
			// image is aligned right. Otherwise always show the right handle.
			if ( align === 'right' ) {
				showLeftHandle = true;
			} else {
				showRightHandle = true;
			}
		}
		/* eslint-enable no-lonely-if */
		resizableBox = (
			<ResizableBox
				ref={ effectResizeableBoxPlacement }
				style={ {
					position: 'absolute',
					// To match the vertical-align: bottom of the img (from style.scss)
					// syncs the top with the img. This matters when the img height is
					// less than the line-height.
					inset: `${ offsetTop }px 0 0 0`,
				} }
				size={ pixelSize }
				minWidth={ minWidth }
				maxWidth={ maxResizeWidth }
				minHeight={ minHeight }
				maxHeight={ maxResizeWidth / ratio }
				lockAspectRatio={ ratio }
				enable={ {
					top: false,
					right: showRightHandle,
					bottom: true,
					left: showLeftHandle,
				} }
				onResizeStart={ () => {
					toggleSelection( false );
				} }
				onResize={ ( event, direction, elt, delta ) => {
					setResizeDelta( delta );
				} }
				onResizeStop={ ( event, direction, elt, delta ) => {
					toggleSelection( true );
					setResizeDelta( null );
					setPixelSize( ( current ) => ( {
						width: current.width + delta.width,
						height: current.height + delta.height,
					} ) );

					// Clear hardcoded width if the resized width is close to the max-content width.
					if (
						maxContentWidth &&
						// Only do this if the image is bigger than the container to prevent it from being squished.
						// TODO: Remove this check if the image support setting 100% width.
						naturalWidth >= maxContentWidth &&
						Math.abs( elt.offsetWidth - maxContentWidth ) < 10
					) {
						setAttributes( {
							width: undefined,
							height: undefined,
						} );
						return;
					}

					// Since the aspect ratio is locked when resizing, we can
					// use the width of the resized element to calculate the
					// height in CSS to prevent stretching when the max-width
					// is reached.
					setAttributes( {
						width: `${ elt.offsetWidth }px`,
						height: 'auto',
						aspectRatio:
							ratio === naturalRatio
								? undefined
								: String( ratio ),
					} );
				} }
				resizeRatio={ align === 'center' ? 2 : 1 }
			/>
		);
	}

	if ( ! url && ! temporaryURL ) {
		return (
			<>
				{ mediaReplaceFlow }
				{ /* Add all controls if the image attributes are connected. */ }
				{ metadata?.bindings ? controls : sizeControls }
			</>
		);
	}

	/**
	 * Set the post's featured image with the current image.
	 */
	const setPostFeatureImage = () => {
		editEntityRecord( 'postType', postType, postId, {
			featured_media: id,
		} );
		createSuccessNotice( __( 'Post featured image updated.' ), {
			type: 'snackbar',
		} );
	};

	const featuredImageControl = (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds } ) =>
				selectedClientIds.length === 1 &&
				! isDescendentOfQueryLoop &&
				postId &&
				id &&
				clientId === selectedClientIds[ 0 ] && (
					<MenuItem onClick={ setPostFeatureImage }>
						{ __( 'Set as featured image' ) }
					</MenuItem>
				)
			}
		</BlockSettingsMenuControls>
	);

	return (
		<>
			{ mediaReplaceFlow }
			{ controls }
			{ featuredImageControl }
			{ img }
			{ resizableBox }

			<Caption
				attributes={ attributes }
				setAttributes={ setAttributes }
				isSelected={ isSingleSelected }
				insertBlocksAfter={ insertBlocksAfter }
				label={ __( 'Image caption text' ) }
				showToolbarButton={
					isSingleSelected &&
					( hasNonContentControls || isContentOnlyMode ) &&
					! hideCaptionControls
				}
			/>
		</>
	);
}
