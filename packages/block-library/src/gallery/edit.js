/**
 * External dependencies
 */
import classnames from 'classnames';
import { filter, map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	IconButton,
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaUpload,
	InspectorControls,
} from '@wordpress/block-editor';
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GalleryImage from './gallery-image';
import icon from './icon';
import { defaultColumnsNumber, pickRelevantMediaFiles } from './shared';

const MAX_COLUMNS = 8;
const linkOptions = [
	{ value: 'attachment', label: __( 'Attachment Page' ) },
	{ value: 'media', label: __( 'Media File' ) },
	{ value: 'none', label: __( 'None' ) },
];
const ALLOWED_MEDIA_TYPES = [ 'image' ];

class GalleryEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectImages = this.onSelectImages.bind( this );
		this.setLinkTo = this.setLinkTo.bind( this );
		this.setColumnsNumber = this.setColumnsNumber.bind( this );
		this.toggleImageCrop = this.toggleImageCrop.bind( this );
		this.onMove = this.onMove.bind( this );
		this.onMoveTo = this.onMoveTo.bind( this );
		this.onRemoveImage = this.onRemoveImage.bind( this );
		this.setImageAttributes = this.setImageAttributes.bind( this );
		this.setAttributes = this.setAttributes.bind( this );

		this.state = {
			selectedImage: null,
		};
	}

	setAttributes( attributes ) {
		if ( attributes.ids ) {
			throw new Error( 'The "ids" attribute should not be changed directly. It is managed automatically when "images" attribute changes' );
		}

		if ( attributes.images ) {
			attributes = {
				...attributes,
				ids: map( attributes.images, 'id' ),
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

	onMove( oldIndex, newIndex ) {
		if ( oldIndex === newIndex ) {
			return;
		}
		const images = [ ...this.props.attributes.images ];
		images.splice( oldIndex, 1 );
		images.splice( newIndex, 0, this.props.attributes.images[ oldIndex ] );
		this.setState( { selectedImage: newIndex } );
		this.setAttributes( { images } );
	}

	onMoveTo( newIndex ) {
		return ( oldIndex ) => {
			this.onMove( oldIndex, newIndex );
		};
	}

	onRemoveImage( index ) {
		return () => {
			const images = filter( this.props.attributes.images, ( img, i ) => index !== i );
			const { columns } = this.props.attributes;
			this.setState( { selectedImage: null } );
			this.setAttributes( {
				images,
				columns: columns ? Math.min( images.length, columns ) : columns,
			} );
		};
	}

	onSelectImages( images ) {
		const { columns } = this.props.attributes;
		this.setAttributes( {
			images: images.map( ( image ) => pickRelevantMediaFiles( image ) ),
			columns: columns ? Math.min( images.length, columns ) : columns,
		} );
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
		return checked ? __( 'Thumbnails are cropped to align.' ) : __( 'Thumbnails are not cropped.' );
	}

	setImageAttributes( index, attributes ) {
		const { attributes: { images } } = this.props;
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

	componentDidUpdate( prevProps ) {
		// Deselect images when deselecting the block
		if ( ! this.props.isSelected && prevProps.isSelected ) {
			this.setState( {
				selectedImage: null,
				captionSelected: false,
			} );
		}
	}

	render() {
		const { attributes, isSelected, className, noticeOperations, noticeUI } = this.props;
		const { images, columns = defaultColumnsNumber( attributes ), align, imageCrop, linkTo } = attributes;

		const hasImages = !! images.length;

		const controls = (
			<BlockControls>
				{ hasImages && (
					<Toolbar>
						<MediaUpload
							onSelect={ this.onSelectImages }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							multiple
							gallery
							value={ images.map( ( img ) => img.id ) }
							render={ ( { open } ) => (
								<IconButton
									className="components-toolbar__control"
									label={ __( 'Edit gallery' ) }
									icon="edit"
									onClick={ open }
								/>
							) }
						/>
					</Toolbar>
				) }
			</BlockControls>
		);

		const mediaPlaceholder = (
			<MediaPlaceholder
				addToGallery={ hasImages }
				isAppender={ hasImages }
				className={ className }
				dropZoneUIOnly={ hasImages && ! isSelected }
				icon={ ! hasImages && <BlockIcon icon={ icon } /> }
				labels={ {
					title: ! hasImages && __( 'Gallery' ),
					instructions: ! hasImages && __( 'Drag images, upload new ones or select files from your library.' ),
				} }
				onSelect={ this.onSelectImages }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				multiple
				value={ hasImages ? images : undefined }
				onError={ noticeOperations.createErrorNotice }
				notices={ hasImages ? undefined : noticeUI }
			/>
		);

		if ( ! hasImages ) {
			return (
				<Fragment>
					{ controls }
					{ mediaPlaceholder }
				</Fragment>
			);
		}

		return (
			<Fragment>
				{ controls }
				<InspectorControls>
					<PanelBody title={ __( 'Gallery Settings' ) }>
						{ images.length > 1 && <RangeControl
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ this.setColumnsNumber }
							min={ 1 }
							max={ Math.min( MAX_COLUMNS, images.length ) }
							required
						/> }
						<ToggleControl
							label={ __( 'Crop Images' ) }
							checked={ !! imageCrop }
							onChange={ this.toggleImageCrop }
							help={ this.getImageCropHelp }
						/>
						<SelectControl
							label={ __( 'Link To' ) }
							value={ linkTo }
							onChange={ this.setLinkTo }
							options={ linkOptions }
						/>
					</PanelBody>
				</InspectorControls>
				{ noticeUI }
				<ul
					className={ classnames(
						className,
						{
							[ `align${ align }` ]: align,
							[ `columns-${ columns }` ]: columns,
							'is-cropped': imageCrop,
						}
					) }
				>
					{ images.map( ( img, index ) => {
						/* translators: %1$d is the order number of the image, %2$d is the total number of images. */
						const ariaLabel = sprintf( __( 'image %1$d of %2$d in gallery' ), ( index + 1 ), images.length );

						return (
							<li className="blocks-gallery-item" key={ img.id || img.url }>
								<GalleryImage
									url={ img.url }
									alt={ img.alt }
									id={ img.id }
									index={ index }
									isSelected={ isSelected && this.state.selectedImage === index }
									onMoveTo={ this.onMoveTo( index ) }
									onRemove={ this.onRemoveImage( index ) }
									onSelect={ this.onSelectImage( index ) }
									setAttributes={ ( attrs ) => this.setImageAttributes( index, attrs ) }
									caption={ img.caption }
									aria-label={ ariaLabel }
								/>
							</li>
						);
					} ) }
				</ul>
				{ mediaPlaceholder }
			</Fragment>
		);
	}
}

export default withNotices( GalleryEdit );
