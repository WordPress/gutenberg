/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mediaUpload } from '@wordpress/utils';
import { Dashicon, Toolbar, Placeholder, FormFileUpload } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType, source } from '../../api';
import MediaUploadButton from '../../media-upload-button';
import InspectorControls from '../../inspector-controls';
import RangeControl from '../../inspector-controls/range-control';
import ToggleControl from '../../inspector-controls/toggle-control';
import SelectControl from '../../inspector-controls/select-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import GalleryImage from './gallery-image';
import BlockDescription from '../../block-description';

const { query, attr } = source;
const isGallery = true;
const MAX_COLUMNS = 8;
const linkOptions = [
	{ value: 'attachment', label: __( 'Attachment Page' ) },
	{ value: 'media', label: __( 'Media File' ) },
	{ value: 'none', label: __( 'None' ) },
];

function defaultColumnsNumber( attributes ) {
	return Math.min( 3, attributes.images.length );
}

registerBlockType( 'core/gallery', {
	title: __( 'Gallery' ),
	icon: 'format-gallery',
	category: 'common',
	keywords: [ __( 'images' ), __( 'photos' ) ],

	attributes: {
		align: {
			type: 'string',
			default: 'none',
		},
		images: {
			type: 'array',
			default: [],
			source: query( 'div.wp-block-gallery figure.blocks-gallery-image img', {
				url: attr( 'src' ),
				alt: attr( 'alt' ),
				id: attr( 'data-id' ),
			} ),
		},
		columns: {
			type: 'number',
		},
		imageCrop: {
			type: 'boolean',
			default: true,
		},
		linkTo: {
			type: 'string',
			default: 'none',
		},
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, className } ) {
		const { images, columns = defaultColumnsNumber( attributes ), align, imageCrop, linkTo } = attributes;
		const setLinkTo = ( value ) => setAttributes( { linkTo: value } );
		const setColumnsNumber = ( value ) => setAttributes( { columns: value } );
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const toggleImageCrop = () => setAttributes( { imageCrop: ! imageCrop } );

		const onSelectImages = ( imgs ) => setAttributes( { images: imgs } );

		const uploadFromFiles = ( event ) => {
			mediaUpload( event.target.files, setAttributes, isGallery );
		};

		const controls = (
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
					/>
					{ !! images.length && (
						<Toolbar>
							<li>
								<MediaUploadButton
									buttonProps={ {
										className: 'components-icon-button components-toolbar__control',
										'aria-label': __( 'Edit Gallery' ),
									} }
									onSelect={ onSelectImages }
									type="image"
									multiple
									gallery
									value={ images.map( ( img ) => img.id ) }
								>
									<Dashicon icon="edit" />
								</MediaUploadButton>
							</li>
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
					<FormFileUpload
						isLarge
						className="wp-block-image__upload-button"
						onChange={ uploadFromFiles }
						accept="image/*"
						multiple="true"
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ onSelectImages }
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
			focus && images.length > 1 && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'Image galleries are a great way to share groups of pictures on your site.' ) }</p>
					</BlockDescription>
					<h3>{ __( 'Gallery Settings' ) }</h3>
					<RangeControl
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ setColumnsNumber }
						min={ 1 }
						max={ Math.min( MAX_COLUMNS, images.length ) }
					/>
					<ToggleControl
						label={ __( 'Crop Images' ) }
						checked={ !! imageCrop }
						onChange={ toggleImageCrop }
					/>
					<SelectControl
						label={ __( 'Link to' ) }
						value={ linkTo }
						onChange={ setLinkTo }
						options={ linkOptions }
					/>
				</InspectorControls>
			),
			<div key="gallery" className={ `${ className } align${ align } columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }` }>
				{ images.map( ( img ) => (
					<GalleryImage key={ img.url } img={ img } />
				) ) }
			</div>,
		];
	},

	save( { attributes } ) {
		const { images, columns = defaultColumnsNumber( attributes ), align, imageCrop, linkTo } = attributes;
		return (
			<div className={ `align${ align } columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }` } >
				{ images.map( ( img ) => (
					<GalleryImage key={ img.url } img={ img } linkTo={ linkTo } />
				) ) }
			</div>
		);
	},

} );
