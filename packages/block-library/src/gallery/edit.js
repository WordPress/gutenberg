/**
 * External dependencies
 */
import {
	every,
	filter,
	find,
	forEach,
	get,
	isEmpty,
	map,
	reduce,
	some,
	toString,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
	withNotices,
	RangeControl,
	Dropdown,
	NavigableMenu,
	MenuItem,
	FormFileUpload,
} from '@wordpress/components';
import {
	BlockControls,
	MediaPlaceholder,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import { Component, createRef, Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { media as mediaIcon, upload } from '@wordpress/icons';
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { sharedIcon } from './shared-icon';
import { defaultColumnsNumber, pickRelevantMediaFiles } from './shared';
import Gallery from './gallery';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
} from './constants';

const MAX_COLUMNS = 8;
const linkOptions = [
	{ value: LINK_DESTINATION_ATTACHMENT, label: __( 'Attachment Page' ) },
	{ value: LINK_DESTINATION_MEDIA, label: __( 'Media File' ) },
	{ value: LINK_DESTINATION_NONE, label: __( 'None' ) },
];
const ALLOWED_MEDIA_TYPES = [ 'image' ];

const PLACEHOLDER_TEXT = Platform.select( {
	web: __(
		'Drag images, upload new ones or select files from your library.'
	),
	native: __( 'ADD MEDIA' ),
} );

const MOBILE_CONTROL_PROPS_RANGE_CONTROL = Platform.select( {
	web: {},
	native: { type: 'stepper' },
} );

class GalleryEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectImages = this.onSelectImages.bind( this );
		this.onDeselectImage = this.onDeselectImage.bind( this );
		this.setLinkTo = this.setLinkTo.bind( this );
		this.setColumnsNumber = this.setColumnsNumber.bind( this );
		this.toggleImageCrop = this.toggleImageCrop.bind( this );
		this.onMove = this.onMove.bind( this );
		this.onMoveForward = this.onMoveForward.bind( this );
		this.onMoveBackward = this.onMoveBackward.bind( this );
		this.onRemoveImage = this.onRemoveImage.bind( this );
		this.onUploadError = this.onUploadError.bind( this );
		this.setImageAttributes = this.setImageAttributes.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.onFocusGalleryCaption = this.onFocusGalleryCaption.bind( this );
		this.getImagesSizeOptions = this.getImagesSizeOptions.bind( this );
		this.updateImagesSize = this.updateImagesSize.bind( this );

		this.state = {
			selectedImage: null,
			attachmentCaptions: null,
		};
	}

	setAttributes( attributes ) {
		if ( attributes.ids ) {
			throw new Error(
				'The "ids" attribute should not be changed directly. It is managed automatically when "images" attribute changes'
			);
		}

		if ( attributes.images ) {
			attributes = {
				...attributes,
				// Unlike images[ n ].id which is a string, always ensure the
				// ids array contains numbers as per its attribute type.
				ids: map( attributes.images, ( { id } ) => parseInt( id, 10 ) ),
			};
		}

		this.props.setAttributes( attributes );
	}

	onSelectImage( index ) {
		return () => {
			if ( this.state.selectedImage !== index ) {
				this.setState( {
					selectedImage: index,
				} );
			}
		};
	}

	onDeselectImage( index ) {
		return () => {
			if ( this.state.selectedImage === index ) {
				this.setState( {
					selectedImage: null,
				} );
			}
		};
	}

	onMove( oldIndex, newIndex ) {
		const images = [ ...this.props.attributes.images ];
		images.splice( newIndex, 1, this.props.attributes.images[ oldIndex ] );
		images.splice( oldIndex, 1, this.props.attributes.images[ newIndex ] );
		this.setState( { selectedImage: newIndex } );
		this.setAttributes( { images } );
	}

	onMoveForward( oldIndex ) {
		return () => {
			if ( oldIndex === this.props.attributes.images.length - 1 ) {
				return;
			}
			this.onMove( oldIndex, oldIndex + 1 );
		};
	}

	onMoveBackward( oldIndex ) {
		return () => {
			if ( oldIndex === 0 ) {
				return;
			}
			this.onMove( oldIndex, oldIndex - 1 );
		};
	}

	onRemoveImage( index ) {
		return () => {
			const images = filter(
				this.props.attributes.images,
				( img, i ) => index !== i
			);
			const { columns } = this.props.attributes;
			this.setState( { selectedImage: null } );
			this.setAttributes( {
				images,
				columns: columns ? Math.min( images.length, columns ) : columns,
			} );
		};
	}

	selectCaption( newImage, images, attachmentCaptions ) {
		// The image id in both the images and attachmentCaptions arrays is a
		// string, so ensure comparison works correctly by converting the
		// newImage.id to a string.
		const newImageId = toString( newImage.id );
		const currentImage = find( images, { id: newImageId } );

		const currentImageCaption = currentImage
			? currentImage.caption
			: newImage.caption;

		if ( ! attachmentCaptions ) {
			return currentImageCaption;
		}

		const attachment = find( attachmentCaptions, {
			id: newImageId,
		} );

		// if the attachment caption is updated
		if ( attachment && attachment.caption !== newImage.caption ) {
			return newImage.caption;
		}

		return currentImageCaption;
	}

	onSelectImages( newImages ) {
		const { columns, images, sizeSlug } = this.props.attributes;
		const { attachmentCaptions } = this.state;
		this.setState( {
			attachmentCaptions: newImages.map( ( newImage ) => ( {
				// Store the attachmentCaption id as a string for consistency
				// with the type of the id in the images attribute.
				id: toString( newImage.id ),
				caption: newImage.caption,
			} ) ),
		} );
		this.setAttributes( {
			images: newImages.map( ( newImage ) => ( {
				...pickRelevantMediaFiles( newImage, sizeSlug ),
				caption: this.selectCaption(
					newImage,
					images,
					attachmentCaptions
				),
				// The id value is stored in a data attribute, so when the
				// block is parsed it's converted to a string. Converting
				// to a string here ensures it's type is consistent.
				id: toString( newImage.id ),
			} ) ),
			columns: columns ? Math.min( newImages.length, columns ) : columns,
		} );
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	setLinkTo( value ) {
		this.setAttributes( { linkTo: value } );
	}

	setColumnsNumber( value ) {
		this.setAttributes( { columns: value } );
	}

	toggleImageCrop() {
		this.setAttributes( { imageCrop: ! this.props.attributes.imageCrop } );
	}

	getImageCropHelp( checked ) {
		return checked
			? __( 'Thumbnails are cropped to align.' )
			: __( 'Thumbnails are not cropped.' );
	}

	onFocusGalleryCaption() {
		this.setState( {
			selectedImage: null,
		} );
	}

	setImageAttributes( index, attributes ) {
		const {
			attributes: { images },
		} = this.props;
		const { setAttributes } = this;
		if ( ! images[ index ] ) {
			return;
		}
		setAttributes( {
			images: [
				...images.slice( 0, index ),
				{
					...images[ index ],
					...attributes,
				},
				...images.slice( index + 1 ),
			],
		} );
	}

	getImagesSizeOptions() {
		const { imageSizes, resizedImages } = this.props;
		return map(
			filter( imageSizes, ( { slug } ) =>
				some( resizedImages, ( sizes ) => sizes[ slug ] )
			),
			( { name, slug } ) => ( { value: slug, label: name } )
		);
	}

	updateImagesSize( sizeSlug ) {
		const {
			attributes: { images },
			resizedImages,
		} = this.props;

		const updatedImages = map( images, ( image ) => {
			if ( ! image.id ) {
				return image;
			}
			const url = get( resizedImages, [
				parseInt( image.id, 10 ),
				sizeSlug,
			] );
			return {
				...image,
				...( url && { url } ),
			};
		} );

		this.setAttributes( { images: updatedImages, sizeSlug } );
	}

	componentDidMount() {
		const { attributes, mediaUpload } = this.props;
		const { images } = attributes;
		if (
			Platform.OS === 'web' &&
			images &&
			images.length > 0 &&
			every( images, ( { url } ) => isBlobURL( url ) )
		) {
			const filesList = map( images, ( { url } ) => getBlobByURL( url ) );
			forEach( images, ( { url } ) => revokeBlobURL( url ) );
			mediaUpload( {
				filesList,
				onFileChange: this.onSelectImages,
				allowedTypes: [ 'image' ],
			} );
		}
	}

	componentDidUpdate( prevProps ) {
		// Deselect images when deselecting the block
		if ( ! this.props.isSelected && prevProps.isSelected ) {
			this.setState( {
				selectedImage: null,
				captionSelected: false,
			} );
		}
		// linkTo attribute must be saved so blocks don't break when changing image_default_link_type in options.php
		if ( ! this.props.attributes.linkTo ) {
			this.setAttributes( {
				linkTo:
					window?.wp?.media?.view?.settings?.defaultProps?.link ||
					LINK_DESTINATION_NONE,
			} );
		}
	}

	render() {
		const {
			attributes,
			className,
			isSelected,
			mediaUpload,
			noticeUI,
			insertBlocksAfter,
		} = this.props;
		const {
			columns = defaultColumnsNumber( attributes ),
			ids,
			imageCrop,
			images,
			linkTo,
			sizeSlug,
		} = attributes;

		const hasImages = !! images.length;

		const mediaPlaceholder = (
			<MediaPlaceholder
				addToGallery={ hasImages }
				className={ className }
				disableMediaButtons={ hasImages && ! isSelected }
				icon={ ! hasImages && sharedIcon }
				labels={ {
					title: ! hasImages && __( 'Gallery' ),
					instructions: ! hasImages && PLACEHOLDER_TEXT,
				} }
				onSelect={ this.onSelectImages }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				multiple
				value={ images }
				onError={ this.onUploadError }
				notices={ hasImages ? undefined : noticeUI }
				onFocus={ this.props.onFocus }
			/>
		);

		if ( ! hasImages ) {
			return mediaPlaceholder;
		}

		const imageSizeOptions = this.getImagesSizeOptions();
		const shouldShowSizeOptions =
			hasImages && ! isEmpty( imageSizeOptions );

		return (
			<>
				<BlockControls>
					{ hasImages && (
						<Dropdown
							popoverProps={ {
								isAlternate: true,
							} }
							contentClassName="block-editor-media-replace-flow__options"
							renderToggle={ ( { isOpen, onToggle } ) => (
								<ToolbarGroup className="media-replace-flow">
									<ToolbarButton
										ref={ createRef() }
										aria-expanded={ isOpen }
										onClick={ onToggle }
										onKeyDown={ ( event ) => {
											if ( event.keyCode === DOWN ) {
												event.preventDefault();
												event.stopPropagation();
												event.target.click();
											}
										} }
									>
										{ __( 'Add' ) }
									</ToolbarButton>
								</ToolbarGroup>
							) }
							renderContent={ ( { onClose } ) => (
								<NavigableMenu className="block-editor-media-replace-flow__media-upload-menu">
									<MediaUpload
										multiple
										gallery
										addToGallery
										title={ __( 'Add image' ) }
										onSelect={ this.onSelectImages }
										onError={ this.onUploadError }
										allowedTypes={ ALLOWED_MEDIA_TYPES }
										value={ ids }
										render={ ( { open } ) => (
											<MenuItem
												icon={ mediaIcon }
												onClick={ open }
											>
												{ __( 'Open Media Library' ) }
											</MenuItem>
										) }
									/>
									<MediaUploadCheck>
										<FormFileUpload
											onChange={ ( event ) => {
												const { files } = event.target;

												// Since the setMedia function runs multiple times per upload group
												// and is passed newMedia containing every item in its group each time, we must
												// filter out whatever this upload group had previously returned to the
												// gallery before adding and returning the image array with replacement newMedia
												// values.

												// Define an array to store urls from newMedia between subsequent function calls.
												let lastMediaPassed = [];
												const setMedia = ( newMedia ) => {
													// Remove any images this upload group is responsible for (lastMediaPassed).
													// Their replacements are contained in newMedia.
													const filteredMedia = (
														images ?? []
													).filter( ( item ) => {
														// If Item has id, only remove it if lastMediaPassed has an item with that id.
														if ( item.id ) {
															return ! lastMediaPassed.some(
																// Be sure to convert to number for comparison.
																( { id } ) =>
																	Number(
																		id
																	) ===
																	Number(
																		item.id
																	)
															);
														}
														// Compare transient images via .includes since gallery may append extra info onto the url.
														return ! lastMediaPassed.some(
															( { urlSlug } ) =>
																item.url.includes(
																	urlSlug
																)
														);
													} );
													// Return the filtered media array along with newMedia.
													this.onSelectImages(
														filteredMedia.concat(
															newMedia
														)
													);
													// Reset lastMediaPassed and set it with ids and urls from newMedia.
													lastMediaPassed = newMedia.map(
														( media ) => {
															// Add everything up to '.fileType' to compare via .includes.
															const cutOffIndex = media.url.lastIndexOf(
																'.'
															);
															const urlSlug = media.url.slice(
																0,
																cutOffIndex
															);
															return {
																id: media.id,
																urlSlug,
															};
														}
													);
												};

												mediaUpload( {
													allowedTypes: ALLOWED_MEDIA_TYPES,
													filesList: files,
													onFileChange: setMedia,
													onError: this.onUploadError,
												} );

												onClose();
											} }
											accept={ ALLOWED_MEDIA_TYPES }
											render={ ( { openFileDialog } ) => (
												<MenuItem
													icon={ upload }
													onClick={ () => {
														openFileDialog();
													} }
												>
													{ __( 'Upload' ) }
												</MenuItem>
											) }
										/>
									</MediaUploadCheck>
								</NavigableMenu>
							) }
						/>
					) }
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Gallery settings' ) }>
						{ images.length > 1 && (
							<RangeControl
								label={ __( 'Columns' ) }
								value={ columns }
								onChange={ this.setColumnsNumber }
								min={ 1 }
								max={ Math.min( MAX_COLUMNS, images.length ) }
								{ ...MOBILE_CONTROL_PROPS_RANGE_CONTROL }
								required
							/>
						) }

						<ToggleControl
							label={ __( 'Crop images' ) }
							checked={ !! imageCrop }
							onChange={ this.toggleImageCrop }
							help={ this.getImageCropHelp }
						/>
						<SelectControl
							label={ __( 'Link to' ) }
							value={ linkTo }
							onChange={ this.setLinkTo }
							options={ linkOptions }
						/>
						{ shouldShowSizeOptions && (
							<SelectControl
								label={ __( 'Image size' ) }
								value={ sizeSlug }
								options={ imageSizeOptions }
								onChange={ this.updateImagesSize }
							/>
						) }
					</PanelBody>
				</InspectorControls>
				{ noticeUI }
				<Gallery
					{ ...this.props }
					selectedImage={ this.state.selectedImage }
					onMoveBackward={ this.onMoveBackward }
					onMoveForward={ this.onMoveForward }
					onRemoveImage={ this.onRemoveImage }
					onSelectImage={ this.onSelectImage }
					onDeselectImage={ this.onDeselectImage }
					onSetImageAttributes={ this.setImageAttributes }
					onFocusGalleryCaption={ this.onFocusGalleryCaption }
					insertBlocksAfter={ insertBlocksAfter }
				/>
			</>
		);
	}
}
export default compose( [
	withSelect( ( select, { attributes: { ids }, isSelected } ) => {
		const { getMedia } = select( 'core' );
		const { getSettings } = select( 'core/block-editor' );
		const { imageSizes, mediaUpload } = getSettings();

		let resizedImages = {};

		if ( isSelected ) {
			resizedImages = reduce(
				ids,
				( currentResizedImages, id ) => {
					if ( ! id ) {
						return currentResizedImages;
					}
					const image = getMedia( id );
					const sizes = reduce(
						imageSizes,
						( currentSizes, size ) => {
							const defaultUrl = get( image, [
								'sizes',
								size.slug,
								'url',
							] );
							const mediaDetailsUrl = get( image, [
								'media_details',
								'sizes',
								size.slug,
								'source_url',
							] );
							return {
								...currentSizes,
								[ size.slug ]: defaultUrl || mediaDetailsUrl,
							};
						},
						{}
					);
					return {
						...currentResizedImages,
						[ parseInt( id, 10 ) ]: sizes,
					};
				},
				{}
			);
		}

		return {
			imageSizes,
			mediaUpload,
			resizedImages,
		};
	} ),
	withNotices,
	withViewportMatch( { isNarrow: '< small' } ),
] )( GalleryEdit );
