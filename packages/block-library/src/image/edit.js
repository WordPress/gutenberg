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
import { getBlobByURL, revokeBlobURL } from '@wordpress/blob';
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
import { create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import ImageSize, { getEditorWidth } from './image-size';

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
	let { caption } = image;

	if ( typeof caption !== 'object' ) {
		caption = create( { html: caption } );
	}

	return {
		...pick( image, [ 'alt', 'id', 'link', 'url' ] ),
		caption,
	};
};

class ImageEdit extends Component {
	constructor() {
		super( ...arguments );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.onImageClick = this.onImageClick.bind( this );
		this.onSelectImage = this.onSelectImage.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );
		this.resetScale = this.resetScale.bind( this );
		this.onSetCustomHref = this.onSetCustomHref.bind( this );
		this.onSetLinkDestination = this.onSetLinkDestination.bind( this );

		this.state = {
			captionFocused: false,
		};
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;
		const { id, url = '' } = attributes;

		if ( ! id && url.indexOf( 'blob:' ) === 0 ) {
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
		const { id: prevID, url: prevUrl = '' } = prevProps.attributes;
		const { id, url = '' } = this.props.attributes;

		if ( ! prevID && prevUrl.indexOf( 'blob:' ) === 0 && id && url.indexOf( 'blob:' ) === -1 ) {
			revokeBlobURL( url );
		}

		if ( ! this.props.isSelected && prevProps.isSelected && this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	onSelectImage( media ) {
		if ( ! media || ! media.url ) {
			this.props.setAttributes( {
				url: undefined,
				alt: undefined,
				id: undefined,
				caption: create(),
			} );
			return;
		}

		const editorWidth = getEditorWidth();
		let src = media.url;
		let img = {};
		let sizesWidth = editorWidth;

		if ( media.sizes ) {
			// The "full" size is included in `sizes`.
			img = media.sizes.large || media.sizes.full;
			src = img.url;
			let imgWidth = img.width;

			if ( img.actual_size && img.actual_size.width ) {
				imgWidth = img.actual_size.width;
			}

			if ( imgWidth < editorWidth ) {
				// The "full" size may be narrower than 100%.
				sizesWidth = imgWidth;
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
			scale: 1,
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
		const extraUpdatedAttributes = [ 'wide', 'full' ].indexOf( nextAlign ) !== -1 ?
			{ scale: 1 } :
			{};
		this.props.setAttributes( { ...extraUpdatedAttributes, align: nextAlign } );
	}

	updateImageURL( url ) {
		this.props.setAttributes( { url, scale: 1 } );
		this.updateSrcsetAndSizes( url );
	}

	updateScale( scale ) {
		this.props.setAttributes( { scale } );
	}

	resetScale() {
		this.props.setAttributes( {
			scale: 1,
		} );
	}

	updateSrcsetAndSizes( url ) {
		const sizes = get( this.props.image, [ 'media_details', 'sizes' ], {} );

		if ( ! sizes.full ) {
			this.resetSrcsetAndSizes();
		}

		let imageData;
		const defaultImage = sizes.large || sizes.full;

		if ( defaultImage.source_url === url ) {
			imageData = defaultImage;
		} else if ( sizes.thumbnail && sizes.thumbnail.source_url === url ) {
			imageData = sizes.thumbnail;
		}

		if ( ! imageData || ! imageData.srcset ) {
			this.resetSrcsetAndSizes();
		} else {
			const editorWidth = getEditorWidth();
			let sizesWidth = editorWidth;

			if ( imageData.width < editorWidth ) {
				sizesWidth = imageData.width;
			}

			this.props.setAttributes( {
				srcSet: imageData.srcset,
				sizes: this.getSizesAttr( sizesWidth ),
			} );
		}
	}

	resetSrcsetAndSizes() {
		this.props.setAttributes( {
			srcSet: null,
			sizes: null,
		} );
	}

	getSizesAttr( width ) {
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

		const fullWidth = sizes.full.width;
		const fullHeight = sizes.full.height;
		let name;
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

	render() {
		const { attributes, setAttributes, isLargeViewport, isSelected, className, maxWidth, noticeOperations, noticeUI, toggleSelection, isRTL } = this.props;
		const { url, alt, caption, align, id, href, linkDestination, scale, srcSet } = attributes;
		const sizesAttr = attributes.sizes;

		const controls = (
			<BlockControls>
				<BlockAlignmentToolbar
					value={ align }
					onChange={ this.updateAlignment }
				/>
				{ !! url && (
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
				) }
			</BlockControls>
		);

		const availableSizes = this.getAvailableSizes();

		if ( ! url ) {
			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon="format-image"
						labels={ {
							title: __( 'Image' ),
							name: __( 'an image' ),
						} }
						className={ className }
						onSelect={ this.onSelectImage }
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
						accept="image/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
					/>
				</Fragment>
			);
		}

		const classes = classnames( className, {
			'is-transient': 0 === url.indexOf( 'blob:' ),
			'is-resized': scale !== 1,
			'is-focused': isSelected,
		} );

		const isResizable = [ 'wide', 'full' ].indexOf( align ) === -1 && isLargeViewport;
		const isLinkURLInputDisabled = linkDestination !== LINK_DESTINATION_CUSTOM;

		const getInspectorControls = ( imageWidthWithinContainer, imageHeightWithinContainer ) => (
			<InspectorControls>
				<PanelBody title={ __( 'Image Settings' ) }>
					<TextareaControl
						label={ __( 'Alt Text (Alternative Text)' ) }
						value={ alt }
						onChange={ this.updateAlt }
						help={ __( 'Describe the purpose of the image. Leave empty if the image is not a key part of the content.' ) }
					/>
					{ ! isEmpty( availableSizes ) && (
						<SelectControl
							label={ __( 'Image Size' ) }
							value={ url }
							options={ map( availableSizes, ( size, name ) => ( {
								value: size.source_url,
								label: startCase( name ),
							} ) ) }
							onChange={ this.updateImageURL }
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
									value={ round( imageWidthWithinContainer * scale ) }
									placeholder={ round( imageWidthWithinContainer * scale ) }
									min={ 1 }
									onChange={ ( value ) => {
										this.updateScale( parseInt( value, 10 ) / imageWidthWithinContainer );
									} }
								/>
								<TextControl
									type="number"
									className="block-library-image__dimensions__height"
									label={ __( 'Height' ) }
									value={ round( imageHeightWithinContainer * scale ) }
									placeholder={ round( imageHeightWithinContainer * scale ) }
									min={ 1 }
									onChange={ ( value ) => {
										this.updateScale( parseInt( value, 10 ) / imageHeightWithinContainer );
									} }
								/>
							</div>
							<div className="block-library-image__dimensions__row">
								<ButtonGroup aria-label={ __( 'Image Size' ) }>
									{ [ 25, 50, 75, 100 ].map( ( percent ) => {
										const isCurrent = scale === percent / 100;

										return (
											<Button
												key={ percent }
												isSmall
												isPrimary={ isCurrent }
												aria-pressed={ isCurrent }
												onClick={ () => this.updateScale( percent / 100 ) }
											>
												{ percent }%
											</Button>
										);
									} ) }
								</ButtonGroup>
								<Button
									isSmall
									onClick={ this.resetScale }
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
						<TextControl
							label={ __( 'Link URL' ) }
							value={ href || '' }
							onChange={ this.onSetCustomHref }
							placeholder={ ! isLinkURLInputDisabled ? 'https://' : undefined }
							disabled={ isLinkURLInputDisabled }
						/>
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

							if ( ! isResizable || ! imageWidthWithinContainer ) {
								return (
									<Fragment>
										{ imageWidthWithinContainer && getInspectorControls( imageWidthWithinContainer, imageHeightWithinContainer ) }
										<div style={ {
											width: imageWidthWithinContainer ? imageWidthWithinContainer * scale : undefined,
											height: imageHeightWithinContainer ? imageHeightWithinContainer * scale : undefined,
										} }>
											{ img }
										</div>
									</Fragment>
								);
							}

							const ratio = imageWidth / imageHeight;
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
									{ getInspectorControls( imageWidth, imageHeight ) }
									<ResizableBox
										size={
											imageWidthWithinContainer && imageHeightWithinContainer ? {
												width: imageWidthWithinContainer * scale,
												height: imageHeightWithinContainer * scale,
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
											const currentWidth = imageWidthWithinContainer * scale;
											const newWidth = parseInt( currentWidth + delta.width, 10 );
											const newScale = newWidth / imageWidthWithinContainer;
											this.updateScale( newScale );
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
