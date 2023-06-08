/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import {
	ExternalLink,
	PanelBody,
	ResizableBox,
	Spinner,
	TextareaControl,
	TextControl,
	ToolbarButton,
} from '@wordpress/components';
import { useViewportMatch, usePrevious } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalImageURLInputUI as ImageURLInputUI,
	MediaReplaceFlow,
	store as blockEditorStore,
	BlockAlignmentControl,
	__experimentalImageEditor as ImageEditor,
	__experimentalGetElementClassName,
	__experimentalUseBorderProps as useBorderProps,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	useEffect,
	useMemo,
	useState,
	useRef,
	useCallback,
} from '@wordpress/element';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import { getFilename } from '@wordpress/url';
import {
	createBlock,
	getDefaultBlockName,
	switchToBlockType,
} from '@wordpress/blocks';
import {
	crop,
	overlayText,
	upload,
	caption as captionIcon,
} from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../private-apis';
import { createUpgradedEmbedBlock } from '../embed/util';
import useClientWidth from './use-client-width';
import { isExternalImage } from './edit';

/**
 * Module constants
 */
import { MIN_SIZE, ALLOWED_MEDIA_TYPES } from './constants';

const { ImageSizeControl } = unlock( blockEditorPrivateApis );

export default function Image( {
	temporaryURL,
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
	onReplace,
	onSelectImage,
	onSelectURL,
	onUploadError,
	containerRef,
	context,
	clientId,
	blockEditingMode,
} ) {
	const {
		url = '',
		alt,
		caption,
		align,
		id,
		href,
		rel,
		linkClass,
		linkDestination,
		title,
		width,
		height,
		linkTarget,
		sizeSlug,
	} = attributes;
	const imageRef = useRef();
	const prevCaption = usePrevious( caption );
	const [ showCaption, setShowCaption ] = useState( !! caption );
	const { allowResize = true } = context;
	const { getBlock } = useSelect( blockEditorStore );

	const { image, multiImageSelection } = useSelect(
		( select ) => {
			const { getMedia } = select( coreStore );
			const { getMultiSelectedBlockClientIds, getBlockName } =
				select( blockEditorStore );
			const multiSelectedClientIds = getMultiSelectedBlockClientIds();
			return {
				image:
					id && isSelected
						? getMedia( id, { context: 'view' } )
						: null,
				multiImageSelection:
					multiSelectedClientIds.length &&
					multiSelectedClientIds.every(
						( _clientId ) =>
							getBlockName( _clientId ) === 'core/image'
					),
			};
		},
		[ id, isSelected ]
	);
	const { canInsertCover, imageEditing, imageSizes, maxWidth, mediaUpload } =
		useSelect(
			( select ) => {
				const {
					getBlockRootClientId,
					getSettings,
					canInsertBlockType,
				} = select( blockEditorStore );

				const rootClientId = getBlockRootClientId( clientId );
				const settings = getSettings();

				return {
					imageEditing: settings.imageEditing,
					imageSizes: settings.imageSizes,
					maxWidth: settings.maxWidth,
					mediaUpload: settings.mediaUpload,
					canInsertCover: canInsertBlockType(
						'core/cover',
						rootClientId
					),
				};
			},
			[ clientId ]
		);
	const { replaceBlocks, toggleSelection } = useDispatch( blockEditorStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideAligned = [ 'wide', 'full' ].includes( align );
	const [
		{ loadedNaturalWidth, loadedNaturalHeight },
		setLoadedNaturalSize,
	] = useState( {} );
	const [ isEditingImage, setIsEditingImage ] = useState( false );
	const [ externalBlob, setExternalBlob ] = useState();
	const clientWidth = useClientWidth( containerRef, [ align ] );
	const hasNonContentControls = blockEditingMode === 'default';
	const isResizable =
		allowResize &&
		hasNonContentControls &&
		! ( isWideAligned && isLargeViewport );
	const imageSizeOptions = imageSizes
		.filter(
			( { slug } ) => image?.media_details?.sizes?.[ slug ]?.source_url
		)
		.map( ( { name, slug } ) => ( { value: slug, label: name } ) );
	const canUploadMedia = !! mediaUpload;

	// If an image is externally hosted, try to fetch the image data. This may
	// fail if the image host doesn't allow CORS with the domain. If it works,
	// we can enable a button in the toolbar to upload the image.
	useEffect( () => {
		if (
			! isExternalImage( id, url ) ||
			! isSelected ||
			! canUploadMedia ||
			externalBlob
		) {
			return;
		}

		window
			.fetch( url )
			.then( ( response ) => response.blob() )
			.then( ( blob ) => setExternalBlob( blob ) )
			// Do nothing, cannot upload.
			.catch( () => {} );
	}, [ id, url, isSelected, externalBlob, canUploadMedia ] );

	// We need to show the caption when changes come from
	// history navigation(undo/redo).
	useEffect( () => {
		if ( caption && ! prevCaption ) {
			setShowCaption( true );
		}
	}, [ caption, prevCaption ] );

	// Focus the caption when we click to add one.
	const captionRef = useCallback(
		( node ) => {
			if ( node && ! caption ) {
				node.focus();
			}
		},
		[ caption ]
	);

	// Get naturalWidth and naturalHeight from image ref, and fall back to loaded natural
	// width and height. This resolves an issue in Safari where the loaded natural
	// width and height is otherwise lost when switching between alignments.
	// See: https://github.com/WordPress/gutenberg/pull/37210.
	const { naturalWidth, naturalHeight } = useMemo( () => {
		return {
			naturalWidth:
				imageRef.current?.naturalWidth ||
				loadedNaturalWidth ||
				undefined,
			naturalHeight:
				imageRef.current?.naturalHeight ||
				loadedNaturalHeight ||
				undefined,
		};
	}, [
		loadedNaturalWidth,
		loadedNaturalHeight,
		imageRef.current?.complete,
	] );

	function onResizeStart() {
		toggleSelection( false );
	}

	function onResizeStop() {
		toggleSelection( true );
	}

	function onImageError() {
		// Check if there's an embed block that handles this URL, e.g., instagram URL.
		// See: https://github.com/WordPress/gutenberg/pull/11472
		const embedBlock = createUpgradedEmbedBlock( { attributes: { url } } );

		if ( undefined !== embedBlock ) {
			onReplace( embedBlock );
		}
	}

	function onSetHref( props ) {
		setAttributes( props );
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
			width: undefined,
			height: undefined,
			sizeSlug: newSizeSlug,
		} );
	}

	function uploadExternal() {
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

	function updateAlignment( nextAlign ) {
		const extraUpdatedAttributes = [ 'wide', 'full' ].includes( nextAlign )
			? { width: undefined, height: undefined }
			: {};
		setAttributes( {
			...extraUpdatedAttributes,
			align: nextAlign,
		} );
	}

	useEffect( () => {
		if ( ! isSelected ) {
			setIsEditingImage( false );
			if ( ! caption ) {
				setShowCaption( false );
			}
		}
	}, [ isSelected, caption ] );

	const canEditImage = id && naturalWidth && naturalHeight && imageEditing;
	const allowCrop = ! multiImageSelection && canEditImage && ! isEditingImage;

	function switchToCover() {
		replaceBlocks(
			clientId,
			switchToBlockType( getBlock( clientId ), 'core/cover' )
		);
	}

	const controls = (
		<>
			<BlockControls group="block">
				{ hasNonContentControls && (
					<BlockAlignmentControl
						value={ align }
						onChange={ updateAlignment }
					/>
				) }
				{ hasNonContentControls && (
					<ToolbarButton
						onClick={ () => {
							setShowCaption( ! showCaption );
							if ( showCaption && caption ) {
								setAttributes( { caption: undefined } );
							}
						} }
						icon={ captionIcon }
						isPressed={ showCaption }
						label={
							showCaption
								? __( 'Remove caption' )
								: __( 'Add caption' )
						}
					/>
				) }
				{ ! multiImageSelection && ! isEditingImage && (
					<ImageURLInputUI
						url={ href || '' }
						onChangeUrl={ onSetHref }
						linkDestination={ linkDestination }
						mediaUrl={ ( image && image.source_url ) || url }
						mediaLink={ image && image.link }
						linkTarget={ linkTarget }
						linkClass={ linkClass }
						rel={ rel }
					/>
				) }
				{ allowCrop && (
					<ToolbarButton
						onClick={ () => setIsEditingImage( true ) }
						icon={ crop }
						label={ __( 'Crop' ) }
					/>
				) }
				{ externalBlob && (
					<ToolbarButton
						onClick={ uploadExternal }
						icon={ upload }
						label={ __( 'Upload external image' ) }
					/>
				) }
				{ ! multiImageSelection && canInsertCover && (
					<ToolbarButton
						icon={ overlayText }
						label={ __( 'Add text over image' ) }
						onClick={ switchToCover }
					/>
				) }
			</BlockControls>
			{ ! multiImageSelection && ! isEditingImage && (
				<BlockControls group="other">
					<MediaReplaceFlow
						mediaId={ id }
						mediaURL={ url }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						accept="image/*"
						onSelect={ onSelectImage }
						onSelectURL={ onSelectURL }
						onError={ onUploadError }
					/>
				</BlockControls>
			) }
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					{ ! multiImageSelection && (
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Alternative text' ) }
							value={ alt }
							onChange={ updateAlt }
							help={
								<>
									<ExternalLink href="https://www.w3.org/WAI/tutorials/images/decision-tree">
										{ __(
											'Describe the purpose of the image.'
										) }
									</ExternalLink>
									<br />
									{ __( 'Leave empty if decorative.' ) }
								</>
							}
						/>
					) }
					<ImageSizeControl
						onChangeImage={ updateImage }
						onChange={ ( value ) => setAttributes( value ) }
						slug={ sizeSlug }
						width={ width }
						height={ height }
						imageSizeOptions={ imageSizeOptions }
						isResizable={ isResizable }
						naturalWidth={ naturalWidth }
						naturalHeight={ naturalHeight }
						imageSizeHelp={ __(
							'Select the size of the source image.'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="advanced">
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Title attribute' ) }
					value={ title || '' }
					onChange={ onSetTitle }
					help={
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
	const isRounded = attributes.className?.includes( 'is-style-rounded' );
	const hasCustomBorder =
		!! borderProps.className ||
		( borderProps.style && Object.keys( borderProps.style ).length > 0 );

	let img = (
		// Disable reason: Image itself is not meant to be interactive, but
		// should direct focus to block.
		/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
		<>
			<img
				src={ temporaryURL || url }
				alt={ defaultedAlt }
				onError={ () => onImageError() }
				onLoad={ ( event ) => {
					setLoadedNaturalSize( {
						loadedNaturalWidth: event.target?.naturalWidth,
						loadedNaturalHeight: event.target?.naturalHeight,
					} );
				} }
				ref={ imageRef }
				className={ borderProps.className }
				style={ borderProps.style }
			/>
			{ temporaryURL && <Spinner /> }
		</>
		/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
	);

	let imageWidthWithinContainer;
	let imageHeightWithinContainer;

	if ( clientWidth && naturalWidth && naturalHeight ) {
		const exceedMaxWidth = naturalWidth > clientWidth;
		const ratio = naturalHeight / naturalWidth;
		imageWidthWithinContainer = exceedMaxWidth ? clientWidth : naturalWidth;
		imageHeightWithinContainer = exceedMaxWidth
			? clientWidth * ratio
			: naturalHeight;
	}

	// clientWidth needs to be a number for the image Cropper to work, but sometimes it's 0
	// So we try using the imageRef width first and fallback to clientWidth.
	const fallbackClientWidth = imageRef.current?.width || clientWidth;

	if ( canEditImage && isEditingImage ) {
		img = (
			<ImageEditor
				id={ id }
				url={ url }
				width={ width }
				height={ height }
				clientWidth={ fallbackClientWidth }
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
		);
	} else if ( ! isResizable || ! imageWidthWithinContainer ) {
		img = <div style={ { width, height } }>{ img }</div>;
	} else {
		const currentWidth = width || imageWidthWithinContainer;
		const currentHeight = height || imageHeightWithinContainer;

		const ratio = naturalWidth / naturalHeight;
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

		img = (
			<ResizableBox
				size={ {
					width: width ?? 'auto',
					height: height && ! hasCustomBorder ? height : 'auto',
				} }
				showHandle={ isSelected }
				minWidth={ minWidth }
				maxWidth={ maxWidthBuffer }
				minHeight={ minHeight }
				maxHeight={ maxWidthBuffer / ratio }
				lockAspectRatio
				enable={ {
					top: false,
					right: showRightHandle,
					bottom: true,
					left: showLeftHandle,
				} }
				onResizeStart={ onResizeStart }
				onResizeStop={ ( event, direction, elt, delta ) => {
					onResizeStop();
					setAttributes( {
						width: parseInt( currentWidth + delta.width, 10 ),
						height: parseInt( currentHeight + delta.height, 10 ),
					} );
				} }
				resizeRatio={ align === 'center' ? 2 : 1 }
			>
				{ img }
			</ResizableBox>
		);
	}

	return (
		<>
			{ /* Hide controls during upload to avoid component remount,
				which causes duplicated image upload. */ }
			{ ! temporaryURL && controls }
			{ img }
			{ showCaption &&
				( ! RichText.isEmpty( caption ) || isSelected ) && (
					<RichText
						identifier="caption"
						className={ __experimentalGetElementClassName(
							'caption'
						) }
						ref={ captionRef }
						tagName="figcaption"
						aria-label={ __( 'Image caption text' ) }
						placeholder={ __( 'Add caption' ) }
						value={ caption }
						onChange={ ( value ) =>
							setAttributes( { caption: value } )
						}
						inlineToolbar
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter(
								createBlock( getDefaultBlockName() )
							)
						}
					/>
				) }
		</>
	);
}
