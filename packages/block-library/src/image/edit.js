/**
 * External dependencies
 */
import classnames from 'classnames';
import {
	find,
	get,
	isEmpty,
	map,
	last,
	pick,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import {
	Button,
	ButtonGroup,
	ExternalLink,
	IconButton,
	MenuItem,
	NavigableMenu,
	PanelBody,
	Path,
	Rect,
	ResizableBox,
	SelectControl,
	Spinner,
	SVG,
	TextareaControl,
	TextControl,
	ToggleControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import {
	LEFT,
	RIGHT,
	UP,
	DOWN,
	BACKSPACE,
	ENTER,
} from '@wordpress/keycodes';
import { withSelect } from '@wordpress/data';
import {
	BlockAlignmentToolbar,
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	URLPopover,
	RichText,
} from '@wordpress/block-editor';
import {
	Component,
	useCallback,
	useState,
	useRef,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getPath } from '@wordpress/url';
import { withViewportMatch } from '@wordpress/viewport';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';
import icon from './icon';
import ImageSize from './image-size';

/**
 * Module constants
 */
const MIN_SIZE = 20;
const LINK_DESTINATION_NONE = 'none';
const LINK_DESTINATION_MEDIA = 'media';
const LINK_DESTINATION_ATTACHMENT = 'attachment';
const LINK_DESTINATION_CUSTOM = 'custom';
const NEW_TAB_REL = 'noreferrer noopener';
const ALLOWED_MEDIA_TYPES = [ 'image' ];
const DEFAULT_SIZE_SLUG = 'large';

export const pickRelevantMediaFiles = ( image ) => {
	const imageProps = pick( image, [ 'alt', 'id', 'link', 'caption' ] );
	imageProps.url = get( image, [ 'sizes', 'large', 'url' ] ) || get( image, [ 'media_details', 'sizes', 'large', 'source_url' ] ) || image.url;
	return imageProps;
};

/**
 * Is the URL a temporary blob URL? A blob URL is one that is used temporarily
 * while the image is being uploaded and will not have an id yet allocated.
 *
 * @param {number=} id The id of the image.
 * @param {string=} url The url of the image.
 *
 * @return {boolean} Is the URL a Blob URL
 */
const isTemporaryImage = ( id, url ) => ! id && isBlobURL( url );

/**
 * Is the url for the image hosted externally. An externally hosted image has no id
 * and is not a blob url.
 *
 * @param {number=} id  The id of the image.
 * @param {string=} url The url of the image.
 *
 * @return {boolean} Is the url an externally hosted url?
 */
const isExternalImage = ( id, url ) => url && ! id && ! isBlobURL( url );

const stopPropagation = ( event ) => {
	event.stopPropagation();
};

const stopPropagationRelevantKeys = ( event ) => {
	if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
		// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
		event.stopPropagation();
	}
};

const ImageURLInputUI = ( {
	advancedOptions,
	linkDestination,
	mediaLinks,
	onChangeUrl,
	url,
} ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const openLinkUI = useCallback( () => {
		setIsOpen( true );
	} );

	const [ isEditingLink, setIsEditingLink ] = useState( false );
	const [ urlInput, setUrlInput ] = useState( null );

	const startEditLink = useCallback( () => {
		if ( linkDestination === LINK_DESTINATION_MEDIA ||
			linkDestination === LINK_DESTINATION_ATTACHMENT
		) {
			setUrlInput( '' );
		}
		setIsEditingLink( true );
	} );
	const stopEditLink = useCallback( () => {
		setIsEditingLink( false );
	} );

	const closeLinkUI = useCallback( () => {
		setUrlInput( null );
		stopEditLink();
		setIsOpen( false );
	} );

	const autocompleteRef = useRef( null );

	const onClickOutside = useCallback( () => {
		return ( event ) => {
			// The autocomplete suggestions list renders in a separate popover (in a portal),
			// so onClickOutside fails to detect that a click on a suggestion occurred in the
			// LinkContainer. Detect clicks on autocomplete suggestions using a ref here, and
			// return to avoid the popover being closed.
			const autocompleteElement = autocompleteRef.current;
			if ( autocompleteElement && autocompleteElement.contains( event.target ) ) {
				return;
			}
			setIsOpen( false );
			setUrlInput( null );
			stopEditLink();
		};
	} );

	const onSubmitLinkChange = useCallback( () => {
		return ( event ) => {
			if ( urlInput ) {
				onChangeUrl( urlInput );
			}
			stopEditLink();
			setUrlInput( null );
			event.preventDefault();
		};
	} );

	const onLinkRemove = useCallback( () => {
		closeLinkUI();
		onChangeUrl( '' );
	} );
	const linkEditorValue = urlInput !== null ? urlInput : url;

	const urlLabel = (
		find( mediaLinks, [ 'linkDestination', linkDestination ] ) || {}
	).title;
	return (
		<>
			<IconButton
				icon="admin-links"
				className="components-toolbar__control"
				label={ url ? __( 'Edit Link' ) : __( 'Insert Link' ) }
				aria-expanded={ isOpen }
				onClick={ openLinkUI }
			/>
			{ isOpen && (
				<URLPopover
					onClickOutside={ onClickOutside() }
					onClose={ closeLinkUI }
					renderSettings={ () => advancedOptions }
					additionalControls={ ! linkEditorValue && (
						<NavigableMenu>
							{
								map( mediaLinks, ( link ) => (
									<MenuItem
										key={ link.linkDestination }
										icon={ link.icon }
										onClick={ () => {
											setUrlInput( null );
											onChangeUrl( link.url );
											stopEditLink();
										} }
									>
										{ link.title }
									</MenuItem>
								) )
							}
						</NavigableMenu>
					) }
				>
					{ ( ! url || isEditingLink ) && (
						<URLPopover.__experimentalLinkEditor
							className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
							value={ linkEditorValue }
							onChangeInputValue={ setUrlInput }
							onKeyDown={ stopPropagationRelevantKeys }
							onKeyPress={ stopPropagation }
							onSubmit={ onSubmitLinkChange() }
							autocompleteRef={ autocompleteRef }
						/>
					) }
					{ ( url && ! isEditingLink ) && (
						<>
							<URLPopover.__experimentalLinkViewer
								className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
								onKeyPress={ stopPropagation }
								url={ url }
								editLink={ startEditLink }
								urlLabel={ urlLabel }
							/>
							<IconButton
								icon="no"
								label={ __( 'Remove Link' ) }
								onClick={ onLinkRemove }
							/>
						</>
					) }
				</URLPopover>
			) }
		</>
	);
};

export class ImageEdit extends Component {
	constructor( { attributes } ) {
		super( ...arguments );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.onImageClick = this.onImageClick.bind( this );
		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectURL = this.onSelectURL.bind( this );
		this.updateImage = this.updateImage.bind( this );
		this.updateWidth = this.updateWidth.bind( this );
		this.updateHeight = this.updateHeight.bind( this );
		this.updateDimensions = this.updateDimensions.bind( this );
		this.onSetHref = this.onSetHref.bind( this );
		this.onSetLinkClass = this.onSetLinkClass.bind( this );
		this.onSetLinkRel = this.onSetLinkRel.bind( this );
		this.onSetNewTab = this.onSetNewTab.bind( this );
		this.getFilename = this.getFilename.bind( this );
		this.toggleIsEditing = this.toggleIsEditing.bind( this );
		this.onUploadError = this.onUploadError.bind( this );
		this.onImageError = this.onImageError.bind( this );
		this.getLinkDestinations = this.getLinkDestinations.bind( this );

		this.state = {
			captionFocused: false,
			isEditing: ! attributes.url,
		};
	}

	componentDidMount() {
		const {
			attributes,
			mediaUpload,
			noticeOperations,
			setAttributes,
		} = this.props;
		const { id, url = '' } = attributes;

		if ( isTemporaryImage( id, url ) ) {
			const file = getBlobByURL( url );

			if ( file ) {
				mediaUpload( {
					filesList: [ file ],
					onFileChange: ( [ image ] ) => {
						setAttributes( pickRelevantMediaFiles( image ) );
					},
					allowedTypes: ALLOWED_MEDIA_TYPES,
					onError: ( message ) => {
						noticeOperations.createErrorNotice( message );
						this.setState( { isEditing: true } );
					},
				} );
			}
		}
	}

	componentDidUpdate( prevProps ) {
		const { id: prevID, url: prevURL = '' } = prevProps.attributes;
		const { id, url = '' } = this.props.attributes;

		if ( isTemporaryImage( prevID, prevURL ) && ! isTemporaryImage( id, url ) ) {
			revokeBlobURL( url );
		}

		if ( ! this.props.isSelected && prevProps.isSelected && this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
		this.setState( {
			isEditing: true,
		} );
	}

	onSelectImage( media ) {
		if ( ! media || ! media.url ) {
			this.props.setAttributes( {
				url: undefined,
				alt: undefined,
				id: undefined,
				caption: undefined,
			} );
			return;
		}

		this.setState( {
			isEditing: false,
		} );

		const { id, url } = this.props.attributes;
		let additionalAttributes;
		// Reset the dimension attributes if changing to a different image.
		if ( ! media.id || media.id !== id ) {
			additionalAttributes = {
				width: undefined,
				height: undefined,
				sizeSlug: DEFAULT_SIZE_SLUG,
			};
		} else {
			// Keep the same url when selecting the same file, so "Image Size" option is not changed.
			additionalAttributes = { url };
		}

		this.props.setAttributes( {
			...pickRelevantMediaFiles( media ),
			...additionalAttributes,
		} );
	}

	onSelectURL( newURL ) {
		const { url } = this.props.attributes;

		if ( newURL !== url ) {
			this.props.setAttributes( {
				url: newURL,
				id: undefined,
				sizeSlug: DEFAULT_SIZE_SLUG,
			} );
		}

		this.setState( {
			isEditing: false,
		} );
	}

	onImageError( url ) {
		// Check if there's an embed block that handles this URL.
		const embedBlock = createUpgradedEmbedBlock(
			{ attributes: { url } }
		);
		if ( undefined !== embedBlock ) {
			this.props.onReplace( embedBlock );
		}
	}

	onSetHref( value ) {
		const linkDestinations = this.getLinkDestinations();
		const { attributes } = this.props;
		const { linkDestination } = attributes;
		let linkDestinationInput;
		if ( ! value ) {
			linkDestinationInput = LINK_DESTINATION_NONE;
		} else {
			linkDestinationInput = (
				find( linkDestinations, ( destination ) => {
					return destination.url === value;
				} ) ||
				{ linkDestination: LINK_DESTINATION_CUSTOM }
			).linkDestination;
		}
		if ( linkDestination !== linkDestinationInput ) {
			this.props.setAttributes( {
				linkDestination: linkDestinationInput,
				href: value,
			} );
			return;
		}
		this.props.setAttributes( { href: value } );
	}

	onSetLinkClass( value ) {
		this.props.setAttributes( { linkClass: value } );
	}

	onSetLinkRel( value ) {
		this.props.setAttributes( { rel: value } );
	}

	onSetNewTab( value ) {
		const { rel } = this.props.attributes;
		const linkTarget = value ? '_blank' : undefined;

		let updatedRel = rel;
		if ( linkTarget && ! rel ) {
			updatedRel = NEW_TAB_REL;
		} else if ( ! linkTarget && rel === NEW_TAB_REL ) {
			updatedRel = undefined;
		}

		this.props.setAttributes( {
			linkTarget,
			rel: updatedRel,
		} );
	}

	onFocusCaption() {
		if ( ! this.state.captionFocused ) {
			this.setState( {
				captionFocused: true,
			} );
		}
	}

	onImageClick() {
		if ( this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	updateAlt( newAlt ) {
		this.props.setAttributes( { alt: newAlt } );
	}

	updateAlignment( nextAlign ) {
		const extraUpdatedAttributes = [ 'wide', 'full' ].indexOf( nextAlign ) !== -1 ?
			{ width: undefined, height: undefined } :
			{};
		this.props.setAttributes( { ...extraUpdatedAttributes, align: nextAlign } );
	}

	updateImage( sizeSlug ) {
		const { image } = this.props;

		const url = get( image, [ 'media_details', 'sizes', sizeSlug, 'source_url' ] );
		if ( ! url ) {
			return null;
		}

		this.props.setAttributes( {
			url,
			width: undefined,
			height: undefined,
			sizeSlug,
		} );
	}

	updateWidth( width ) {
		this.props.setAttributes( { width: parseInt( width, 10 ) } );
	}

	updateHeight( height ) {
		this.props.setAttributes( { height: parseInt( height, 10 ) } );
	}

	updateDimensions( width = undefined, height = undefined ) {
		return () => {
			this.props.setAttributes( { width, height } );
		};
	}

	getFilename( url ) {
		const path = getPath( url );
		if ( path ) {
			return last( path.split( '/' ) );
		}
	}

	getLinkDestinations() {
		return [
			{
				linkDestination: LINK_DESTINATION_MEDIA,
				title: __( 'Media File' ),
				url: ( this.props.image && this.props.image.source_url ) ||
					this.props.attributes.url,
				icon,
			},
			{
				linkDestination: LINK_DESTINATION_ATTACHMENT,
				title: __( 'Attachment Page' ),
				url: this.props.image && this.props.image.link,
				icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path d="M0 0h24v24H0V0z" fill="none" /><Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" /></SVG>,
			},
		];
	}

	toggleIsEditing() {
		this.setState( {
			isEditing: ! this.state.isEditing,
		} );
		if ( this.state.isEditing ) {
			speak( __( 'You are now viewing the image in the image block.' ) );
		} else {
			speak( __( 'You are now editing the image in the image block.' ) );
		}
	}

	getImageSizeOptions() {
		const { imageSizes } = this.props;
		return map( imageSizes, ( { name, slug } ) => ( { value: slug, label: name } ) );
	}

	render() {
		const { isEditing } = this.state;
		const {
			attributes,
			setAttributes,
			isLargeViewport,
			isSelected,
			className,
			maxWidth,
			noticeUI,
			toggleSelection,
			isRTL,
		} = this.props;
		const {
			url,
			alt,
			caption,
			align,
			id,
			href,
			rel,
			linkClass,
			linkDestination,
			width,
			height,
			linkTarget,
			sizeSlug,
		} = attributes;

		const isExternal = isExternalImage( id, url );
		const editImageIcon = ( <SVG width={ 20 } height={ 20 } viewBox="0 0 20 20"><Rect x={ 11 } y={ 3 } width={ 7 } height={ 5 } rx={ 1 } /><Rect x={ 2 } y={ 12 } width={ 7 } height={ 5 } rx={ 1 } /><Path d="M13,12h1a3,3,0,0,1-3,3v2a5,5,0,0,0,5-5h1L15,9Z" /><Path d="M4,8H3l2,3L7,8H6A3,3,0,0,1,9,5V3A5,5,0,0,0,4,8Z" /></SVG> );
		const controls = (
			<BlockControls>
				<BlockAlignmentToolbar
					value={ align }
					onChange={ this.updateAlignment }
				/>
				{ url && (
					<>
						<Toolbar>
							<IconButton
								className={ classnames( 'components-icon-button components-toolbar__control', { 'is-active': this.state.isEditing } ) }
								label={ __( 'Edit image' ) }
								aria-pressed={ this.state.isEditing }
								onClick={ this.toggleIsEditing }
								icon={ editImageIcon }
							/>
						</Toolbar>
						<Toolbar>
							<ImageURLInputUI
								url={ href || '' }
								onChangeUrl={ this.onSetHref }
								mediaLinks={ this.getLinkDestinations() }
								linkDestination={ linkDestination }
								advancedOptions={
									<>
										<ToggleControl
											label={ __( 'Open in New Tab' ) }
											onChange={ this.onSetNewTab }
											checked={ linkTarget === '_blank' } />
										<TextControl
											label={ __( 'Link CSS Class' ) }
											value={ linkClass || '' }
											onKeyPress={ stopPropagation }
											onKeyDown={ stopPropagationRelevantKeys }
											onChange={ this.onSetLinkClass }
										/>
										<TextControl
											label={ __( 'Link Rel' ) }
											value={ rel || '' }
											onChange={ this.onSetLinkRel }
											onKeyPress={ stopPropagation }
											onKeyDown={ stopPropagationRelevantKeys }
										/>
									</>
								}
							/>
						</Toolbar>
					</>
				) }
			</BlockControls>
		);
		const src = isExternal ? url : undefined;
		const labels = {
			title: ! url ? __( 'Image' ) : __( 'Edit image' ),
			instructions: __( 'Upload an image file, pick one from your media library, or add one with a URL.' ),
		};
		const mediaPreview = ( !! url && <img
			alt={ __( 'Edit image' ) }
			title={ __( 'Edit image' ) }
			className={ 'edit-image-preview' }
			src={ url }
		/> );
		const mediaPlaceholder = (
			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
				className={ className }
				labels={ labels }
				onSelect={ this.onSelectImage }
				onSelectURL={ this.onSelectURL }
				onDoubleClick={ this.toggleIsEditing }
				onCancel={ !! url && this.toggleIsEditing }
				notices={ noticeUI }
				onError={ this.onUploadError }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				value={ { id, src } }
				mediaPreview={ mediaPreview }
				dropZoneUIOnly={ ! isEditing && url }
			/>
		);
		if ( isEditing || ! url ) {
			return (
				<>
					{ controls }
					{ mediaPlaceholder }
				</>
			);
		}

		const classes = classnames( className, {
			'is-transient': isBlobURL( url ),
			'is-resized': !! width || !! height,
			'is-focused': isSelected,
			[ `size-${ sizeSlug }` ]: sizeSlug,
		} );

		const isResizable = [ 'wide', 'full' ].indexOf( align ) === -1 && isLargeViewport;

		const imageSizeOptions = this.getImageSizeOptions();

		const getInspectorControls = ( imageWidth, imageHeight ) => (
			<InspectorControls>
				<PanelBody title={ __( 'Image Settings' ) }>
					<TextareaControl
						label={ __( 'Alt Text (Alternative Text)' ) }
						value={ alt }
						onChange={ this.updateAlt }
						help={
							<>
								<ExternalLink href="https://www.w3.org/WAI/tutorials/images/decision-tree">
									{ __( 'Describe the purpose of the image' ) }
								</ExternalLink>
								{ __( 'Leave empty if the image is purely decorative.' ) }
							</>
						}
					/>
					{ ! isEmpty( imageSizeOptions ) && (
						<SelectControl
							label={ __( 'Image Size' ) }
							value={ sizeSlug }
							options={ imageSizeOptions }
							onChange={ this.updateImage }
						/>
					) }
					{ isResizable && (
						<div className="block-library-image__dimensions">
							<p className="block-library-image__dimensions__row">
								{ __( 'Image Dimensions' ) }
							</p>
							<div className="block-library-image__dimensions__row">
								<TextControl
									type="number"
									className="block-library-image__dimensions__width"
									label={ __( 'Width' ) }
									value={ width || imageWidth || '' }
									min={ 1 }
									onChange={ this.updateWidth }
								/>
								<TextControl
									type="number"
									className="block-library-image__dimensions__height"
									label={ __( 'Height' ) }
									value={ height || imageHeight || '' }
									min={ 1 }
									onChange={ this.updateHeight }
								/>
							</div>
							<div className="block-library-image__dimensions__row">
								<ButtonGroup aria-label={ __( 'Image Size' ) }>
									{ [ 25, 50, 75, 100 ].map( ( scale ) => {
										const scaledWidth = Math.round( imageWidth * ( scale / 100 ) );
										const scaledHeight = Math.round( imageHeight * ( scale / 100 ) );

										const isCurrent = width === scaledWidth && height === scaledHeight;

										return (
											<Button
												key={ scale }
												isSmall
												isPrimary={ isCurrent }
												aria-pressed={ isCurrent }
												onClick={ this.updateDimensions( scaledWidth, scaledHeight ) }
											>
												{ scale }%
											</Button>
										);
									} ) }
								</ButtonGroup>
								<Button
									isSmall
									onClick={ this.updateDimensions() }
								>
									{ __( 'Reset' ) }
								</Button>
							</div>
						</div>
					) }
				</PanelBody>
			</InspectorControls>
		);

		// Disable reason: Each block can be selected by clicking on it
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<>
				{ controls }
				<figure className={ classes }>
					<ImageSize src={ url } dirtynessTrigger={ align }>
						{ ( sizes ) => {
							const {
								imageWidthWithinContainer,
								imageHeightWithinContainer,
								imageWidth,
								imageHeight,
							} = sizes;

							const filename = this.getFilename( url );
							let defaultedAlt;
							if ( alt ) {
								defaultedAlt = alt;
							} else if ( filename ) {
								defaultedAlt = sprintf( __( 'This image has an empty alt attribute; its file name is %s' ), filename );
							} else {
								defaultedAlt = __( 'This image has an empty alt attribute' );
							}

							const img = (
								// Disable reason: Image itself is not meant to be interactive, but
								// should direct focus to block.
								/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
								<>
									<img
										src={ url }
										alt={ defaultedAlt }
										onDoubleClick={ this.toggleIsEditing }
										onClick={ this.onImageClick }
										onError={ () => this.onImageError( url ) }
									/>
									{ isBlobURL( url ) && <Spinner /> }
								</>
								/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
							);

							if ( ! isResizable || ! imageWidthWithinContainer ) {
								return (
									<>
										{ getInspectorControls( imageWidth, imageHeight ) }
										<div style={ { width, height } }>
											{ img }
										</div>
									</>
								);
							}

							const currentWidth = width || imageWidthWithinContainer;
							const currentHeight = height || imageHeightWithinContainer;

							const ratio = imageWidth / imageHeight;
							const minWidth = imageWidth < imageHeight ? MIN_SIZE : MIN_SIZE * ratio;
							const minHeight = imageHeight < imageWidth ? MIN_SIZE : MIN_SIZE / ratio;

							// With the current implementation of ResizableBox, an image needs an explicit pixel value for the max-width.
							// In absence of being able to set the content-width, this max-width is currently dictated by the vanilla editor style.
							// The following variable adds a buffer to this vanilla style, so 3rd party themes have some wiggleroom.
							// This does, in most cases, allow you to scale the image beyond the width of the main column, though not infinitely.
							// @todo It would be good to revisit this once a content-width variable becomes available.
							const maxWidthBuffer = maxWidth * 2.5;

							let showRightHandle = false;
							let showLeftHandle = false;

							/* eslint-disable no-lonely-if */
							// See https://github.com/WordPress/gutenberg/issues/7584.
							if ( align === 'center' ) {
								// When the image is centered, show both handles.
								showRightHandle = true;
								showLeftHandle = true;
							} else if ( isRTL ) {
								// In RTL mode the image is on the right by default.
								// Show the right handle and hide the left handle only when it is aligned left.
								// Otherwise always show the left handle.
								if ( align === 'left' ) {
									showRightHandle = true;
								} else {
									showLeftHandle = true;
								}
							} else {
								// Show the left handle and hide the right handle only when the image is aligned right.
								// Otherwise always show the right handle.
								if ( align === 'right' ) {
									showLeftHandle = true;
								} else {
									showRightHandle = true;
								}
							}
							/* eslint-enable no-lonely-if */

							return (
								<>
									{ getInspectorControls( imageWidth, imageHeight ) }
									<ResizableBox
										size={ {
											width,
											height,
										} }
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
										onResizeStart={ () => {
											toggleSelection( false );
										} }
										onResizeStop={ ( event, direction, elt, delta ) => {
											setAttributes( {
												width: parseInt( currentWidth + delta.width, 10 ),
												height: parseInt( currentHeight + delta.height, 10 ),
											} );
											toggleSelection( true );
										} }
									>
										{ img }
									</ResizableBox>
								</>
							);
						} }
					</ImageSize>
					{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							unstableOnFocus={ this.onFocusCaption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							isSelected={ this.state.captionFocused }
							inlineToolbar
						/>
					) }
				</figure>
				{ mediaPlaceholder }
			</>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default compose( [
	withSelect( ( select, props ) => {
		const { getMedia } = select( 'core' );
		const { getSettings } = select( 'core/block-editor' );
		const { id } = props.attributes;
		const {
			__experimentalMediaUpload,
			imageSizes,
			isRTL,
			maxWidth,
		} = getSettings();

		return {
			image: id ? getMedia( id ) : null,
			maxWidth,
			isRTL,
			imageSizes,
			mediaUpload: __experimentalMediaUpload,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withNotices,
] )( ImageEdit );
