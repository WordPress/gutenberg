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
	keyBy,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
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
import ImageSize from './image-size';

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
		this.updateWidth = this.updateWidth.bind( this );
		this.updateHeight = this.updateHeight.bind( this );
		this.updateDimensions = this.updateDimensions.bind( this );
		this.onSetCustomHref = this.onSetCustomHref.bind( this );
		this.onSetLinkDestination = this.onSetLinkDestination.bind( this );
		this.getFilename = this.getFilename.bind( this );
		this.toggleIsEditing = this.toggleIsEditing.bind( this );

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

		this.props.setAttributes( {
			...pickRelevantMediaFiles( media ),
			width: undefined,
			height: undefined,
		} );
	}

	onSetLinkDestination( value ) {
		let href;

		if ( value === LINK_DESTINATION_NONE ) {
			href = undefined;
		} else if ( value === LINK_DESTINATION_MEDIA ) {
			href = ( this.props.image && this.props.image.source_url ) || this.props.attributes.url;
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
		const extraUpdatedAttributes = [ 'wide', 'full' ].indexOf( nextAlign ) !== -1 ?
			{ width: undefined, height: undefined } :
			{};
		this.props.setAttributes( { ...extraUpdatedAttributes, align: nextAlign } );
	}

	updateImageURL( url ) {
		this.props.setAttributes( { url, width: undefined, height: undefined } );
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
		if ( url ) {
			const fileName = url.match( /.*\/(.+?)(\?.*)?$/ );
			if ( fileName ) {
				return fileName[ 1 ];
			}
		}
		return '';
	}

	getImageSizes() {
		return get( this.props.image, [ 'media_details', 'sizes' ], {} );
	}

	getLinkDestinationOptions() {
		return [
			{ value: LINK_DESTINATION_NONE, label: __( 'None' ) },
			{ value: LINK_DESTINATION_MEDIA, label: __( 'Media File' ) },
			{ value: LINK_DESTINATION_ATTACHMENT, label: __( 'Attachment Page' ) },
			{ value: LINK_DESTINATION_CUSTOM, label: __( 'Custom URL' ) },
		];
	}

	toggleIsEditing() {
		this.setState( {
			isEditing: ! this.state.isEditing,
		} );
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
			noticeOperations,
			noticeUI,
			toggleSelection,
			isRTL,
			availableImageSizes,
		} = this.props;
		const { url, alt, caption, align, id, href, linkDestination, width, height, linkTarget } = attributes;
		const isExternal = isExternalImage( id, url );
		const availableImageSizesBySlug = keyBy( availableImageSizes, 'slug' );

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

		const imageSizes = this.getImageSizes();
		const isResizable = [ 'wide', 'full' ].indexOf( align ) === -1 && isLargeViewport;
		const isLinkURLInputDisabled = linkDestination !== LINK_DESTINATION_CUSTOM;

		const getInspectorControls = ( imageWidth, imageHeight ) => (
			<InspectorControls>
				<PanelBody title={ __( 'Image Settings' ) }>
					<TextareaControl
						label={ __( 'Alt Text (Alternative Text)' ) }
						value={ alt }
						onChange={ this.updateAlt }
						help={ __( 'Alternative text describes your image to people who can’t see it. Add a short description with its key details.' ) }
					/>
					{ ! isEmpty( imageSizes ) && (
						<SelectControl
							label={ __( 'Image Size' ) }
							value={ url }
							options={ map( imageSizes, ( size, slug ) => ( {
								value: size.source_url,
								label: availableImageSizesBySlug[ slug ] ? availableImageSizesBySlug[ slug ].name : startCase( slug ),
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
									value={ width !== undefined ? width : '' }
									placeholder={ imageWidth }
									min={ 1 }
									onChange={ this.updateWidth }
								/>
								<TextControl
									type="number"
									className="block-library-image__dimensions__height"
									label={ __( 'Height' ) }
									value={ height !== undefined ? height : '' }
									placeholder={ imageHeight }
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

							const defaultedAlt = alt ? alt : sprintf( __( 'This image has an empty alt attribute; its file name is %s' ), this.getFilename( url ) );
							// Disable reason: Image itself is not meant to be
							// interactive, but should direct focus to block
							// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
							const img = <img src={ url } alt={ defaultedAlt } onClick={ this.onImageClick } />;

							if ( ! isResizable || ! imageWidthWithinContainer ) {
								return (
									<Fragment>
										{ getInspectorControls( imageWidth, imageHeight ) }
										<div style={ { width, height } }>
											{ img }
										</div>
									</Fragment>
								);
							}

							const currentWidth = width || imageWidthWithinContainer;
							const currentHeight = height || imageHeightWithinContainer;

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

							return (
								<Fragment>
									{ getInspectorControls( imageWidth, imageHeight ) }
									<ResizableBox
										size={
											width && height ? {
												width,
												height,
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
											setAttributes( {
												width: parseInt( currentWidth + delta.width, 10 ),
												height: parseInt( currentHeight + delta.height, 10 ),
											} );
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
		const { maxWidth, isRTL, availableImageSizes } = getEditorSettings();

		return {
			image: id ? getMedia( id ) : null,
			maxWidth,
			isRTL,
			availableImageSizes,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withNotices,
] )( ImageEdit );
