/**
 * External dependencies
 */
import classnames from 'classnames';
import {
	get,
	isEmpty,
	map,
	pick,
	startCase,
	round,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { getBlobByURL, revokeBlobURL, isBlobURL } from '@wordpress/blob';
import {
	Button,
	ButtonGroup,
	IconButton,
	PanelBody,
	ResizableBox,
	SelectControl,
	TextControl,
	TextareaControl,
	Toolbar,
	withNotices,
	ToggleControl,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import {
	RichText,
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	BlockAlignmentToolbar,
	mediaUpload,
} from '@wordpress/editor';
import { withViewportMatch } from '@wordpress/viewport';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ImageSize, { getBlockWidth } from './image-size';

/**
 * Module constants
 */
const MIN_SIZE = 20;
const LINK_DESTINATION_NONE = 'none';
const LINK_DESTINATION_MEDIA = 'media';
const LINK_DESTINATION_ATTACHMENT = 'attachment';
const LINK_DESTINATION_CUSTOM = 'custom';
const ALLOWED_MEDIA_TYPES = [ 'image' ];

export const pickRelevantMediaFiles = ( image ) => {
	return pick( image, [ 'alt', 'id', 'link', 'url', 'caption' ] );
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

class ImageEdit extends Component {
	constructor( { attributes } ) {
		super( ...arguments );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.onImageClick = this.onImageClick.bind( this );
		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectURL = this.onSelectURL.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );
		this.onSetCustomHref = this.onSetCustomHref.bind( this );
		this.onSetLinkDestination = this.onSetLinkDestination.bind( this );
		this.toggleIsEditing = this.toggleIsEditing.bind( this );
		this.updateWidth = this.updateWidth.bind( this );
		this.updateHeight = this.updateHeight.bind( this );
		this.resetWidthHeight = this.resetWidthHeight.bind( this );

		this.state = {
			captionFocused: false,
			isEditing: ! attributes.url,
		};
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;
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
				} );
			}
		}
	}

	componentDidUpdate( prevProps ) {
		const { id: prevID, url: prevURL = '' } = prevProps.attributes;
		const { id, url = '', fileWidth } = this.props.attributes;
		const imageData = this.props.image;
		const blockWidth = getBlockWidth();

		// Store the block width inside the editor for later.
		this.props.setAttributes( { editWidth: blockWidth } );

		if ( isTemporaryImage( prevID, prevURL ) && ! isTemporaryImage( id, url ) ) {
			revokeBlobURL( url );
		}

		if ( ! this.props.isSelected && prevProps.isSelected && this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}

		if ( url && imageData && ! fileWidth ) {
			// Old post or just uploaded image. Attempt to update the image props.
			const imageMeta = imageData.media_details;

			if ( imageMeta ) {
				const sizeFull = imageMeta.sizes.full;
				const sizeLarge = imageMeta.sizes.large;

				if ( url === sizeFull.source_url ) {
					if ( sizeLarge && this.imageMatchesRatio( sizeFull.width, sizeFull.height, sizeLarge.width, sizeLarge.height ) ) {
						// If the full size image was used, and there's a large size that matches the ratio, replace full with large size.
						this.updateImageURL( sizeLarge.source_url, imageMeta.sizes );
					} else {
						// Add srcset, sizes, and image file dimensions.
						this.updateSrcsetAndSizes( sizeFull );
					}
				}
			}
		}
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

		const blockWidth = getBlockWidth();
		let src = media.url;
		let img = {};
		let sizesWidth = blockWidth;
		let actualWidth;
		let actualHeight;

		if ( media.sizes ) {
			// The "full" size is already included in `sizes`.
			img = media.sizes.large || media.sizes.full;
			src = img.url;
			actualWidth = img.width;
			actualHeight = img.height;

			if ( img.actual_size && img.actual_size.width ) {
				actualWidth = img.actual_size.width;
				actualHeight = img.actual_size.height;
			}

			if ( actualWidth < blockWidth ) {
				// The "full" size may be narrower than 100%.
				sizesWidth = actualWidth;
			}

			if ( img.srcset ) {
				img.sizes = this.getSizesAttr( sizesWidth );
			}
		}

		this.props.setAttributes( {
			...pickRelevantMediaFiles( media ),
			url: src,
			srcSet: img.srcset,
			sizes: img.sizes,

			// Not used in the editor, passed to the front-end in block attributes.
			fileWidth: actualWidth,
			fileHeight: actualHeight,
		} );
	}

	onSetLinkDestination( value ) {
		let href;

		if ( value === LINK_DESTINATION_NONE ) {
			href = undefined;
		} else if ( value === LINK_DESTINATION_MEDIA ) {
			href = this.props.attributes.url;
		} else if ( value === LINK_DESTINATION_ATTACHMENT ) {
			href = this.props.image && this.props.image.link;
		} else {
			href = this.props.attributes.href;
		}

		this.props.setAttributes( {
			linkDestination: value,
			href,
		} );
	}

	onSelectURL( newURL ) {
		const { url } = this.props.attributes;

		if ( newURL !== url ) {
			this.props.setAttributes( {
				url: newURL,
				id: undefined,
			} );
			this.resetWidthHeight();
			this.resetSrcsetAndSizes();
		}

		this.setState( {
			isEditing: false,
		} );
	}

	onSetCustomHref( value ) {
		this.props.setAttributes( { href: value } );
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
		const { align, width, fileWidth, fileHeight } = this.props.attributes;
		const blockWidth = getBlockWidth();
		const isFullWidth = ( ! width || ( width >= blockWidth ) ) && ( fileWidth >= blockWidth );

		/* eslint-disable no-mixed-operators */
		// Reason for disabling: buggy, throws incorrect errors... :)
		if ( nextAlign === 'wide' || nextAlign === 'full' ) {
			// Reset all sizing attributes.
			this.resetWidthHeight();
		} else if ( ( nextAlign === 'right' || nextAlign === 'left' ) && isFullWidth ) {
			// When an image is floated resize it to 50% if large enough and not already resized.
			this.updateWidth( blockWidth * 0.5, fileWidth, fileHeight );
		} else if (
			( align === 'right' && nextAlign !== 'left' ) ||
			( align === 'left' && nextAlign !== 'right' ) &&
			fileWidth >= blockWidth &&
			width === blockWidth * 0.5
		) {
			// Revert the above.
			this.resetWidthHeight();
		}
		/* eslint-enable no-mixed-operators */

		this.props.setAttributes( { align: nextAlign } );
	}

	updateImageURL( url, availableSizes ) {
		this.resetWidthHeight();
		let imageData;
		let size;

		// Find the image data.
		for ( size in availableSizes ) {
			if ( availableSizes[ size ].source_url === url ) {
				imageData = availableSizes[ size ];
				break;
			}
		}

		this.updateSrcsetAndSizes( imageData );
		this.props.setAttributes( { url } );
	}

	updateWidth( width, imageWidth, imageHeight, directInput ) {
		width = parseInt( width, 10 );
		imageWidth = imageWidth || this.props.attributes.imageWidth;
		imageHeight = imageHeight || this.props.attributes.imageHeight;

		// Reset the image size when the user deletes the value.
		if ( ! width || ! imageWidth || ! imageHeight ) {
			this.resetWidthHeight();
			return;
		}

		const height = round( imageHeight * ( width / imageWidth ) );
		this.setWidthHeight( width, height, directInput );
	}

	updateHeight( height, imageWidth, imageHeight, directInput ) {
		height = parseInt( height, 10 );
		imageWidth = imageWidth || this.props.attributes.imageWidth;
		imageHeight = imageHeight || this.props.attributes.imageHeight;

		// Reset the image size when the user deletes the value.
		if ( ! height || ! imageWidth || ! imageHeight ) {
			this.resetWidthHeight();
			return;
		}

		const width = round( imageWidth * ( height / imageHeight ) );
		this.setWidthHeight( width, height, directInput );
	}

	setWidthHeight( width, height, directInput ) {
		// Set image size and also store the values separately when set directly by the user.
		const userWidth = directInput ? width : undefined;
		const userHeight = directInput ? height : undefined;

		this.props.setAttributes( {
			width,
			height,
			userWidth,
			userHeight,
		} );
	}

	resetWidthHeight() {
		this.props.setAttributes( {
			width: undefined,
			height: undefined,
			userWidth: undefined,
			userHeight: undefined,
		} );
	}

	updateSrcsetAndSizes( imageData ) {
		if ( ! imageData ) {
			this.resetSrcsetAndSizes();
		} else if ( ! imageData.srcset ) {
			this.props.setAttributes( {
				srcSet: undefined,
				sizes: undefined,
				fileWidth: imageData.width,
				fileHeight: imageData.height,
			} );
		} else {
			const blockWidth = getBlockWidth();
			const sizesWidth = ( imageData.width < blockWidth ) ? imageData.width : blockWidth;

			this.props.setAttributes( {
				srcSet: imageData.srcset,
				sizes: this.getSizesAttr( sizesWidth ),
				fileWidth: imageData.width,
				fileHeight: imageData.height,
			} );
		}
	}

	resetSrcsetAndSizes() {
		this.props.setAttributes( {
			srcSet: undefined,
			sizes: undefined,
			fileWidth: undefined,
			fileHeight: undefined,
		} );
	}

	getSizesAttr( width ) {
		// For use inside the editor.
		return '(max-width: '.concat( width, 'px) 100vw, ', width, 'px' );
	}

	getLinkDestinationOptions() {
		return [
			{ value: LINK_DESTINATION_NONE, label: __( 'None' ) },
			{ value: LINK_DESTINATION_MEDIA, label: __( 'Media File' ) },
			{ value: LINK_DESTINATION_ATTACHMENT, label: __( 'Attachment Page' ) },
			{ value: LINK_DESTINATION_CUSTOM, label: __( 'Custom URL' ) },
		];
	}

	/**
	 * Helper function to test if aspect ratios for two images match.
	 *
	 * @param {number} fullWidth  Width of the image in pixels.
	 * @param {number} fullHeight Height of the image in pixels.
	 * @param {number} targetWidth  Width of the smaller image in pixels.
	 * @param {number} targetHeight Height of the smaller image in pixels.
	 * @return {boolean} True if aspect ratios match within 1px. False if not.
	 */
	imageMatchesRatio( fullWidth, fullHeight, targetWidth, targetHeight ) {
		if ( ! fullWidth || ! fullHeight || ! targetWidth || ! targetHeight ) {
			return false;
		}

		const { width, height } = this.constrainImageDimensions( fullWidth, fullHeight, targetWidth );

		// If the image dimensions are within 1px of the expected size, we consider it a match.
		return ( Math.abs( width - targetWidth ) <= 1 && Math.abs( height - targetHeight ) <= 1 );
	}

	constrainImageDimensions( fullWidth, fullHeight, targetWidth ) {
		const ratio = targetWidth / fullWidth;

		// Very small dimensions may result in 0, 1 should be the minimum.
		const height = Math.max( 1, round( fullHeight * ratio ) );
		let width = Math.max( 1, round( fullWidth * ratio ) );

		// Sometimes, due to rounding, we'll end up with a result like this: 465x700 in a 177x177 box is 117x176... a pixel short.
		if ( width === targetWidth - 1 ) {
			width = targetWidth; // Round it up
		}

		return {
			width: width,
			height: height,
		};
	}

	getAvailableSizes() {
		const sizes = get( this.props.image, [ 'media_details', 'sizes' ], {} );

		if ( ! sizes.full ) {
			return;
		}

		let name;
		const fullWidth = sizes.full.width;
		const fullHeight = sizes.full.height;
		const showSizes = {
			default: sizes.large || sizes.full,
			// Always show the thumbnail size.
			thumbnail: sizes.thumbnail,
		};

		for ( name in sizes ) {
			const size = sizes[ name ];

			// Add custom sizes that do not match the ratio (they won't be in the srcset).
			if ( ! this.imageMatchesRatio( fullWidth, fullHeight, size.width, size.height ) ) {
				showSizes[ name ] = size;
			}
		}

		// Possibly a mismatch?
		if ( showSizes.hasOwnProperty( 'large' ) ) {
			delete showSizes.default;
		}

		return showSizes;
	}

	toggleIsEditing() {
		this.setState( {
			isEditing: ! this.state.isEditing,
		} );
	}

	render() {
		const { isEditing } = this.state;
		const { attributes, setAttributes, isLargeViewport, isSelected, className, maxWidth, noticeOperations, noticeUI, toggleSelection, isRTL } = this.props;
		const { url, alt, caption, align, id, href, linkDestination, srcSet, width, height, userWidth, userHeight, linkTarget } = attributes;
		const isExternal = isExternalImage( id, url );
		const sizesAttr = attributes.sizes;

		let toolbarEditButton;
		if ( url ) {
			if ( isExternal ) {
				toolbarEditButton = (
					<Toolbar>
						<IconButton
							className="components-icon-button components-toolbar__control"
							label={ __( 'Edit image' ) }
							onClick={ this.toggleIsEditing }
							icon="edit"
						/>
					</Toolbar>
				);
			} else {
				toolbarEditButton = (
					<Toolbar>
						<MediaUpload
							onSelect={ this.onSelectImage }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							value={ id }
							render={ ( { open } ) => (
								<IconButton
									className="components-toolbar__control"
									label={ __( 'Edit image' ) }
									icon="edit"
									onClick={ open }
								/>
							) }
						/>
					</Toolbar>
				);
			}
		}

		const controls = (
			<BlockControls>
				<BlockAlignmentToolbar
					value={ align }
					onChange={ this.updateAlignment }
				/>
				{ toolbarEditButton }
			</BlockControls>
		);

		if ( isEditing ) {
			const src = isExternal ? url : undefined;

			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon="format-image"
						className={ className }
						onSelect={ this.onSelectImage }
						onSelectURL={ this.onSelectURL }
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
						accept="image/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						value={ { id, src } }
					/>
				</Fragment>
			);
		}

		const classes = classnames( className, {
			'is-transient': isBlobURL( url ),
			'is-resized': !! width || !! height,
			'is-focused': isSelected,
		} );

		const availableSizes = this.getAvailableSizes();
		const isResizable = [ 'wide', 'full' ].indexOf( align ) === -1 && isLargeViewport;
		const isLinkURLInputDisabled = linkDestination !== LINK_DESTINATION_CUSTOM;

		const getInspectorControls = ( imageWidthWithinContainer, imageHeightWithinContainer, imageWidth, imageHeight ) => (
			<InspectorControls>
				<PanelBody title={ __( 'Image Settings' ) }>
					<TextareaControl
						label={ __( 'Alt Text (Alternative Text)' ) }
						value={ alt }
						onChange={ this.updateAlt }
						help={ __( 'Alternative text describes your image to people who can’t see it. Add a short description with its key details.' ) }
					/>
					{ ! isEmpty( availableSizes ) && (
						<SelectControl
							label={ __( 'Image Size' ) }
							value={ url }
							options={ map( availableSizes, ( size, name ) => ( {
								value: size.source_url,
								label: startCase( name ),
							} ) ) }
							onChange={ ( src ) => {
								this.updateImageURL( src, availableSizes );
							} }
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
									value={ userWidth ? userWidth : '' }
									placeholder={ imageWidth }
									min={ 1 }
									onChange={ ( value ) => {
										this.updateWidth( value, imageWidth, imageHeight, true );
									} }
								/>
								<TextControl
									type="number"
									className="block-library-image__dimensions__height"
									label={ __( 'Height' ) }
									value={ userHeight ? userHeight : '' }
									placeholder={ imageHeight }
									min={ 1 }
									onChange={ ( value ) => {
										this.updateHeight( value, imageWidth, imageHeight, true );
									} }
								/>
							</div>
							<div className="block-library-image__dimensions__row">
								<ButtonGroup aria-label={ __( 'Image Size' ) }>
									{ [ 25, 50, 75, 100 ].map( ( percent ) => {
										const blockWidth = getBlockWidth();

										// Percentage is relative to the block width.
										let scaledWidth = round( blockWidth * ( percent / 100 ) );
										let isCurrent = false;

										if ( scaledWidth > imageWidth ) {
											scaledWidth = imageWidth;
											isCurrent = percent === 100 && ( ! width || width === scaledWidth );
										} else {
											isCurrent = ( width === scaledWidth ) || ( ! width && percent === 100 && imageWidth > blockWidth );
										}

										return (
											<Button
												key={ percent }
												isSmall
												isPrimary={ isCurrent }
												aria-pressed={ isCurrent }
												onClick={ () => this.updateWidth( scaledWidth, imageWidth, imageHeight ) }
											>
												{ percent }%
											</Button>
										);
									} ) }
								</ButtonGroup>
								<Button
									isSmall
									onClick={ this.resetWidthHeight }
								>
									{ __( 'Reset' ) }
								</Button>
							</div>
						</div>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Link Settings' ) }>
					<SelectControl
						label={ __( 'Link To' ) }
						value={ linkDestination }
						options={ this.getLinkDestinationOptions() }
						onChange={ this.onSetLinkDestination }
					/>
					{ linkDestination !== LINK_DESTINATION_NONE && (
						<Fragment>
							<TextControl
								label={ __( 'Link URL' ) }
								value={ href || '' }
								onChange={ this.onSetCustomHref }
								placeholder={ ! isLinkURLInputDisabled ? 'https://' : undefined }
								disabled={ isLinkURLInputDisabled }
							/>
							<ToggleControl
								label={ __( 'Open in New Tab' ) }
								onChange={ () => setAttributes( { linkTarget: ! linkTarget ? '_blank' : undefined } ) }
								checked={ linkTarget === '_blank' } />
						</Fragment>
					) }
				</PanelBody>
			</InspectorControls>
		);

		// Disable reason: Each block can be selected by clicking on it
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<Fragment>
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

							// Disable reason: Image itself is not meant to be
							// interactive, but should direct focus to block
							// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
							const img = <img
								src={ url }
								alt={ alt }
								srcSet={ srcSet }
								sizes={ sizesAttr }
								onClick={ this.onImageClick }
							/>;

							// Floating a resized image can produce inaccurate `imageWidthWithinContainer`.
							const ratio = imageWidth / imageHeight;
							const blockWidth = getBlockWidth();
							let constrainedWidth;
							let constrainedHeight;

							if ( ( align === 'wide' || align === 'full' ) && imageWidthWithinContainer > blockWidth ) {
								// Do not limit the width.
								constrainedWidth = imageWidthWithinContainer;
								constrainedHeight = imageHeightWithinContainer;
							} else {
								constrainedWidth = width || imageWidth;
								constrainedWidth = constrainedWidth	> blockWidth ? blockWidth : constrainedWidth;
								constrainedHeight = round( constrainedWidth / ratio, 2 ) || undefined;
							}

							if ( ! isResizable || ! imageWidthWithinContainer ) {
								return (
									<Fragment>
										{ imageWidthWithinContainer && getInspectorControls( imageWidthWithinContainer, imageHeightWithinContainer, imageWidth, imageHeight ) }
										<div style={ {
											width: constrainedWidth,
											height: constrainedHeight,
										} }>
											{ img }
										</div>
									</Fragment>
								);
							}

							const minWidth = imageWidth < imageHeight ? MIN_SIZE : MIN_SIZE * ratio;
							const minHeight = imageHeight < imageWidth ? MIN_SIZE : MIN_SIZE / ratio;

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
								<Fragment>
									{ getInspectorControls( imageWidthWithinContainer, imageHeightWithinContainer, imageWidth, imageHeight ) }
									<ResizableBox
										size={
											( constrainedWidth && constrainedHeight ) ? {
												width: constrainedWidth,
												height: constrainedHeight,
											} : undefined
										}
										minWidth={ minWidth }
										maxWidth={ maxWidth }
										minHeight={ minHeight }
										maxHeight={ maxWidth / ratio }
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
											let newWidth = parseInt( constrainedWidth + delta.width, 10 );

											// Snap-to-border for the last pixel when resizing by dragging.
											// That highlights the 100% width button.
											if ( Math.abs( constrainedWidth - newWidth ) < 2 ) {
												newWidth = constrainedWidth;
											}

											// Don't upscale.
											if ( newWidth > imageWidth ) {
												newWidth = imageWidth;
											}

											this.updateWidth( newWidth, imageWidth, imageHeight );
											toggleSelection( true );
										} }
									>
										{ img }
									</ResizableBox>
								</Fragment>
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
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default compose( [
	withSelect( ( select, props ) => {
		const { getMedia } = select( 'core' );
		const { getEditorSettings } = select( 'core/editor' );
		const { id } = props.attributes;
		const { maxWidth, isRTL } = getEditorSettings();

		return {
			image: id ? getMedia( id ) : null,
			maxWidth,
			isRTL,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withNotices,
] )( ImageEdit );
