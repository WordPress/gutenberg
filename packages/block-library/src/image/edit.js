/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, filter, map, last, omit, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import {
	ExternalLink,
	PanelBody,
	ResizableBox,
	Spinner,
	TextareaControl,
	TextControl,
	ToolbarGroup,
	withNotices,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	BlockAlignmentToolbar,
	BlockControls,
	BlockIcon,
	InspectorControls,
	InspectorAdvancedControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	RichText,
	__experimentalImageSizeControl as ImageSizeControl,
	__experimentalImageURLInputUI as ImageURLInputUI,
} from '@wordpress/block-editor';
import { Component } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getPath } from '@wordpress/url';
import { withViewportMatch } from '@wordpress/viewport';
import { image as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';
import ImageSize from './image-size';
/**
 * Module constants
 */
import {
	MIN_SIZE,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_ATTACHMENT,
	ALLOWED_MEDIA_TYPES,
	DEFAULT_SIZE_SLUG,
} from './constants';

export const pickRelevantMediaFiles = ( image ) => {
	const imageProps = pick( image, [ 'alt', 'id', 'link', 'caption' ] );
	imageProps.url =
		get( image, [ 'sizes', 'large', 'url' ] ) ||
		get( image, [ 'media_details', 'sizes', 'large', 'source_url' ] ) ||
		image.url;
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

export class ImageEdit extends Component {
	constructor() {
		super( ...arguments );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.onImageClick = this.onImageClick.bind( this );
		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectURL = this.onSelectURL.bind( this );
		this.updateImage = this.updateImage.bind( this );
		this.onSetHref = this.onSetHref.bind( this );
		this.onSetTitle = this.onSetTitle.bind( this );
		this.getFilename = this.getFilename.bind( this );
		this.onUploadError = this.onUploadError.bind( this );
		this.onImageError = this.onImageError.bind( this );

		this.state = {
			captionFocused: false,
		};
	}

	componentDidMount() {
		const { attributes, mediaUpload, noticeOperations } = this.props;
		const { id, url = '' } = attributes;

		if ( isTemporaryImage( id, url ) ) {
			const file = getBlobByURL( url );

			if ( file ) {
				mediaUpload( {
					filesList: [ file ],
					onFileChange: ( [ image ] ) => {
						this.onSelectImage( image );
					},
					allowedTypes: ALLOWED_MEDIA_TYPES,
					onError: ( message ) => {
						noticeOperations.createErrorNotice( message );
					},
				} );
			}
		}
	}

	componentDidUpdate( prevProps ) {
		const { id: prevID, url: prevURL = '' } = prevProps.attributes;
		const { id, url = '' } = this.props.attributes;

		if (
			isTemporaryImage( prevID, prevURL ) &&
			! isTemporaryImage( id, url )
		) {
			revokeBlobURL( url );
		}

		if (
			! this.props.isSelected &&
			prevProps.isSelected &&
			this.state.captionFocused
		) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	onSelectImage( media ) {
		if ( ! media || ! media.url ) {
			this.props.setAttributes( {
				url: undefined,
				alt: undefined,
				id: undefined,
				title: undefined,
				caption: undefined,
			} );
			return;
		}

		const {
			id,
			url,
			alt,
			caption,
			linkDestination,
		} = this.props.attributes;

		let mediaAttributes = pickRelevantMediaFiles( media );

		// If the current image is temporary but an alt text was meanwhile written by the user,
		// make sure the text is not overwritten.
		if ( isTemporaryImage( id, url ) ) {
			if ( alt ) {
				mediaAttributes = omit( mediaAttributes, [ 'alt' ] );
			}
		}

		// If a caption text was meanwhile written by the user,
		// make sure the text is not overwritten by empty captions
		if ( caption && ! get( mediaAttributes, [ 'caption' ] ) ) {
			mediaAttributes = omit( mediaAttributes, [ 'caption' ] );
		}

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

		// Check if the image is linked to it's media.
		if ( linkDestination === LINK_DESTINATION_MEDIA ) {
			// Update the media link.
			mediaAttributes.href = media.url;
		}

		// Check if the image is linked to the attachment page.
		if ( linkDestination === LINK_DESTINATION_ATTACHMENT ) {
			// Update the media link.
			mediaAttributes.href = media.link;
		}

		this.props.setAttributes( {
			...mediaAttributes,
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
	}

	onImageError( url ) {
		// Check if there's an embed block that handles this URL.
		const embedBlock = createUpgradedEmbedBlock( { attributes: { url } } );
		if ( undefined !== embedBlock ) {
			this.props.onReplace( embedBlock );
		}
	}

	onSetHref( props ) {
		this.props.setAttributes( props );
	}

	onSetTitle( value ) {
		// This is the HTML title attribute, separate from the media object title
		this.props.setAttributes( { title: value } );
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
		const extraUpdatedAttributes =
			[ 'wide', 'full' ].indexOf( nextAlign ) !== -1
				? { width: undefined, height: undefined }
				: {};
		this.props.setAttributes( {
			...extraUpdatedAttributes,
			align: nextAlign,
		} );
	}

	updateImage( sizeSlug ) {
		const { image } = this.props;

		const url = get( image, [
			'media_details',
			'sizes',
			sizeSlug,
			'source_url',
		] );
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

	getFilename( url ) {
		const path = getPath( url );
		if ( path ) {
			return last( path.split( '/' ) );
		}
	}

	getImageSizeOptions() {
		const { imageSizes, image } = this.props;
		return map(
			filter( imageSizes, ( { slug } ) =>
				get( image, [ 'media_details', 'sizes', slug, 'source_url' ] )
			),
			( { name, slug } ) => ( { value: slug, label: name } )
		);
	}

	render() {
		const {
			attributes,
			setAttributes,
			isLargeViewport,
			isSelected,
			className,
			maxWidth,
			noticeUI,
			isRTL,
			onResizeStart,
			onResizeStop,
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
			title,
			width,
			height,
			linkTarget,
			sizeSlug,
		} = attributes;

		const isExternal = isExternalImage( id, url );
		const controls = (
			<BlockControls>
				<BlockAlignmentToolbar
					value={ align }
					onChange={ this.updateAlignment }
				/>
				{ url && (
					<MediaReplaceFlow
						mediaId={ id }
						mediaURL={ url }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						accept="image/*"
						onSelect={ this.onSelectImage }
						onSelectURL={ this.onSelectURL }
						onError={ this.onUploadError }
					/>
				) }
				{ url && (
					<ToolbarGroup>
						<ImageURLInputUI
							url={ href || '' }
							onChangeUrl={ this.onSetHref }
							linkDestination={ linkDestination }
							mediaUrl={
								this.props.image && this.props.image.source_url
							}
							mediaLink={
								this.props.image && this.props.image.link
							}
							linkTarget={ linkTarget }
							linkClass={ linkClass }
							rel={ rel }
						/>
					</ToolbarGroup>
				) }
			</BlockControls>
		);
		const src = isExternal ? url : undefined;
		const labels = {
			title: ! url ? __( 'Image' ) : __( 'Edit image' ),
			instructions: __(
				'Upload an image file, pick one from your media library, or add one with a URL.'
			),
		};
		const mediaPreview = !! url && (
			<img
				alt={ __( 'Edit image' ) }
				title={ __( 'Edit image' ) }
				className={ 'edit-image-preview' }
				src={ url }
			/>
		);
		const mediaPlaceholder = (
			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
				className={ className }
				labels={ labels }
				onSelect={ this.onSelectImage }
				onSelectURL={ this.onSelectURL }
				notices={ noticeUI }
				onError={ this.onUploadError }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				value={ { id, src } }
				mediaPreview={ mediaPreview }
				disableMediaButtons={ url }
			/>
		);
		if ( ! url ) {
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

		const isResizable =
			[ 'wide', 'full' ].indexOf( align ) === -1 && isLargeViewport;

		const imageSizeOptions = this.getImageSizeOptions();

		const getInspectorControls = ( imageWidth, imageHeight ) => (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Image settings' ) }>
						<TextareaControl
							label={ __( 'Alt Text (Alternative Text)' ) }
							value={ alt }
							onChange={ this.updateAlt }
							help={
								<>
									<ExternalLink href="https://www.w3.org/WAI/tutorials/images/decision-tree">
										{ __(
											'Describe the purpose of the image'
										) }
									</ExternalLink>
									{ __(
										'Leave empty if the image is purely decorative.'
									) }
								</>
							}
						/>
						<ImageSizeControl
							onChangeImage={ this.updateImage }
							onChange={ ( value ) => setAttributes( value ) }
							slug={ sizeSlug }
							width={ width }
							height={ height }
							imageSizeOptions={ imageSizeOptions }
							isResizable={ isResizable }
							imageWidth={ imageWidth }
							imageHeight={ imageHeight }
						/>
					</PanelBody>
				</InspectorControls>
				<InspectorAdvancedControls>
					<TextControl
						label={ __( 'Title Attribute' ) }
						value={ title || '' }
						onChange={ this.onSetTitle }
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
				</InspectorAdvancedControls>
			</>
		);

		// Disable reason: Each block can be selected by clicking on it
		/* eslint-disable jsx-a11y/click-events-have-key-events */
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
								defaultedAlt = sprintf(
									__(
										'This image has an empty alt attribute; its file name is %s'
									),
									filename
								);
							} else {
								defaultedAlt = __(
									'This image has an empty alt attribute'
								);
							}

							const img = (
								// Disable reason: Image itself is not meant to be interactive, but
								// should direct focus to block.
								/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
								<>
									<img
										src={ url }
										alt={ defaultedAlt }
										onClick={ this.onImageClick }
										onError={ () =>
											this.onImageError( url )
										}
									/>
									{ isBlobURL( url ) && <Spinner /> }
								</>
								/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
							);

							if (
								! isResizable ||
								! imageWidthWithinContainer
							) {
								return (
									<>
										{ getInspectorControls(
											imageWidth,
											imageHeight
										) }
										<div style={ { width, height } }>
											{ img }
										</div>
									</>
								);
							}

							const currentWidth =
								width || imageWidthWithinContainer;
							const currentHeight =
								height || imageHeightWithinContainer;

							const ratio = imageWidth / imageHeight;
							const minWidth =
								imageWidth < imageHeight
									? MIN_SIZE
									: MIN_SIZE * ratio;
							const minHeight =
								imageHeight < imageWidth
									? MIN_SIZE
									: MIN_SIZE / ratio;

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
									{ getInspectorControls(
										imageWidth,
										imageHeight
									) }
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
										onResizeStart={ onResizeStart }
										onResizeStop={ (
											event,
											direction,
											elt,
											delta
										) => {
											onResizeStop();
											setAttributes( {
												width: parseInt(
													currentWidth + delta.width,
													10
												),
												height: parseInt(
													currentHeight +
														delta.height,
													10
												),
											} );
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
							onChange={ ( value ) =>
								setAttributes( { caption: value } )
							}
							isSelected={ this.state.captionFocused }
							inlineToolbar
						/>
					) }
				</figure>
				{ mediaPlaceholder }
			</>
		);
		/* eslint-enable jsx-a11y/click-events-have-key-events */
	}
}

export default compose( [
	withDispatch( ( dispatch ) => {
		const { toggleSelection } = dispatch( 'core/block-editor' );

		return {
			onResizeStart: () => toggleSelection( false ),
			onResizeStop: () => toggleSelection( true ),
		};
	} ),
	withSelect( ( select, props ) => {
		const { getMedia } = select( 'core' );
		const { getSettings } = select( 'core/block-editor' );
		const {
			attributes: { id },
			isSelected,
		} = props;
		const { mediaUpload, imageSizes, isRTL, maxWidth } = getSettings();

		return {
			image: id && isSelected ? getMedia( id ) : null,
			maxWidth,
			isRTL,
			imageSizes,
			mediaUpload,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withNotices,
] )( ImageEdit );
