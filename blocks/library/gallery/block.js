/**
 * External Dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { mediaUpload } from '@wordpress/utils';
import { Dashicon, DropZone, Toolbar, Placeholder, FormFileUpload } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MediaUploadButton from '../../media-upload-button';
import InspectorControls from '../../inspector-controls';
import RangeControl from '../../inspector-controls/range-control';
import ToggleControl from '../../inspector-controls/toggle-control';
import SelectControl from '../../inspector-controls/select-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import GalleryImage from './gallery-image';

const isGallery = true;
const MAX_COLUMNS = 8;
const linkOptions = [
	{ value: 'attachment', label: __( 'Attachment Page' ) },
	{ value: 'media', label: __( 'Media File' ) },
	{ value: 'none', label: __( 'None' ) },
];

export function defaultColumnsNumber( attributes ) {
	return Math.min( 3, attributes.images.length );
}

class GalleryBlock extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectImages = this.onSelectImages.bind( this );
		this.setLinkTo = this.setLinkTo.bind( this );
		this.setColumnsNumber = this.setColumnsNumber.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.toggleImageCrop = this.toggleImageCrop.bind( this );
		this.uploadFromFiles = this.uploadFromFiles.bind( this );
		this.onRemoveImage = this.onRemoveImage.bind( this );
		this.setImageAttributes = this.setImageAttributes.bind( this );
		this.dropFiles = this.dropFiles.bind( this );

		this.state = {
			selectedImage: null,
		};
	}

	onSelectImage( index ) {
		return () => {
			this.setState( ( state ) => ( {
				selectedImage: index === state.selectedImage ? null : index,
			} ) );
		};
	}

	onRemoveImage( index ) {
		return () => {
			const images = filter( this.props.attributes.images, ( img, i ) => index !== i );
			const { columns } = this.props.attributes;
			this.props.setAttributes( {
				images,
				columns: columns ? Math.min( images.length, columns ) : columns,
			} );
		};
	}

	onSelectImages( imgs ) {
		this.props.setAttributes( { images: imgs } );
	}

	setLinkTo( value ) {
		this.props.setAttributes( { linkTo: value } );
	}

	setColumnsNumber( value ) {
		this.props.setAttributes( { columns: value } );
	}

	updateAlignment( nextAlign ) {
		this.props.setAttributes( { align: nextAlign } );
	}

	toggleImageCrop() {
		this.props.setAttributes( { imageCrop: ! this.props.attributes.imageCrop } );
	}

	uploadFromFiles( event ) {
		mediaUpload( event.target.files, this.props.setAttributes, isGallery );
	}

	setImageAttributes( index, attributes ) {
		const { attributes: { images }, setAttributes } = this.props;

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

	dropFiles( files ) {
		const currentImages = this.props.attributes.images || [];
		const { setAttributes } = this.props;
		mediaUpload(
			files,
			( { images } ) => {
				setAttributes( {
					images: currentImages.concat( images ),
				} );
			},
			isGallery
		);
	}

	render() {
		const { attributes, focus, className } = this.props;
		const { images, columns = defaultColumnsNumber( attributes ), align, imageCrop, linkTo } = attributes;

		const dropZone = (
			<DropZone
				onFilesDrop={ this.dropFiles }
			/>
		);

		const controls = (
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ this.updateAlignment }
					/>
					{ !! images.length && (
						<Toolbar>
							<MediaUploadButton
								buttonProps={ {
									className: 'components-icon-button components-toolbar__control',
									'aria-label': __( 'Edit Gallery' ),
								} }
								onSelect={ this.onSelectImages }
								type="image"
								multiple
								gallery
								value={ images.map( ( img ) => img.id ) }
							>
								<Dashicon icon="edit" />
							</MediaUploadButton>
						</Toolbar>
					) }
				</BlockControls>
			)
		);

		if ( images.length === 0 ) {
			const uploadButtonProps = { isLarge: true };

			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag images here or insert from media library' ) }
					icon="format-gallery"
					label={ __( 'Gallery' ) }
					className={ className }>
					{ dropZone }
					<FormFileUpload
						isLarge
						className="wp-block-image__upload-button"
						onChange={ this.uploadFromFiles }
						accept="image/*"
						multiple="true"
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ this.onSelectImages }
						type="image"
						multiple
						gallery
					>
						{ __( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>,
			];
		}

		return [
			controls,
			focus && (
				<InspectorControls key="inspector">
					<h2>{ __( 'Gallery Settings' ) }</h2>
					{ images.length > 1 && <RangeControl
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ this.setColumnsNumber }
						min={ 1 }
						max={ Math.min( MAX_COLUMNS, images.length ) }
					/> }
					<ToggleControl
						label={ __( 'Crop Images' ) }
						checked={ !! imageCrop }
						onChange={ this.toggleImageCrop }
					/>
					<SelectControl
						label={ __( 'Link to' ) }
						value={ linkTo }
						onChange={ this.setLinkTo }
						options={ linkOptions }
					/>
				</InspectorControls>
			),
			<div key="gallery" className={ `${ className } align${ align } columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }` }>
				{ dropZone }
				{ images.map( ( img, index ) => (
					<GalleryImage
						key={ img.id || img.url }
						url={ img.url }
						alt={ img.alt }
						id={ img.id }
						isSelected={ this.state.selectedImage === index }
						onRemove={ this.onRemoveImage( index ) }
						onClick={ this.onSelectImage( index ) }
						setAttributes={ ( attrs ) => this.setImageAttributes( index, attrs ) }
					/>
				) ) }
			</div>,
		];
	}
}

export default GalleryBlock;
