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
import { IconButton, Button, DropZone, Toolbar, Placeholder, FormFileUpload } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MediaUpload from '../../media-upload';
import InspectorControls from '../../inspector-controls';
import RangeControl from '../../inspector-controls/range-control';
import ToggleControl from '../../inspector-controls/toggle-control';
import SelectControl from '../../inspector-controls/select-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import GalleryImage from './gallery-image';

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
		this.onReorderImage = this.onReorderImage.bind( this );
		this.setImageAttributes = this.setImageAttributes.bind( this );
		this.dropFiles = this.dropFiles.bind( this );

		this.state = {
			selectedImage: null,
		};
	}

	onSelectImage( index ) {
		return () => {
			console.log(index);
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

	onReorderImage( event, index, direction ) {
		event.stopPropagation();
		const { attributes: { images }, setAttributes } = this.props;
		let to = 0;
		switch(direction) {
			case 'left':
				to = index - 1;
				break;
			case 'right':
				to = index + 1;
				break;
			default:
				return false;
		}

		const newImages = Array.from(images);
		
		newImages.splice(to, 0, newImages.splice(index, 1)[0]);

		this.setState({selectedImage: to});
		setAttributes( { images: newImages } );
		
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
		mediaUpload( event.target.files, ( images ) => {
			this.props.setAttributes( { images } );
		} );
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
			( images ) => {
				setAttributes( {
					images: currentImages.concat( images ),
				} );
			}
		);
	}

	componentWillReceiveProps( nextProps ) {
		// Deselect images when losing focus
		if ( ! nextProps.focus && this.props.focus ) {
			this.setState( {
				selectedImage: null,
			} );
		}
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
							<MediaUpload
								onSelect={ this.onSelectImages }
								type="image"
								multiple
								gallery
								value={ images.map( ( img ) => img.id ) }
								render={ ( { open } ) => (
									<IconButton
										className="components-toolbar__control"
										label={ __( 'Edit Gallery' ) }
										icon="edit"
										onClick={ open }
									/>
								) }
							/>
						</Toolbar>
					) }
				</BlockControls>
			)
		);

		if ( images.length === 0 ) {
			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag images here or add from media library' ) }
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
					<MediaUpload
						onSelect={ this.onSelectImages }
						type="image"
						multiple
						gallery
						render={ ( { open } ) => (
							<Button isLarge onClick={ open }>
								{ __( 'Add from Media Library' ) }
							</Button>
						) }
					/>
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
			<ul key="gallery" className={ `${ className } align${ align } columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }` }>
				{ dropZone }
				{ images.map( ( img, index ) => (
					<li className="blocks-gallery-item" key={ img.id || img.url }>
						<GalleryImage
							url={ img.url }
							alt={ img.alt }
							id={ img.id }
							isSelected={ this.state.selectedImage === index }
							onRemove={ this.onRemoveImage( index ) }
							onClick={ this.onSelectImage( index ) }
							onReorder={(event, direction) => this.onReorderImage( event, index, direction )}
							isFirst={index === 0}
							isLast={index === images.length - 1}
							setAttributes={ ( attrs ) => this.setImageAttributes( index, attrs ) }
						/>
					</li>
				) ) }
			</ul>,
		];
	}
}

export default GalleryBlock;
