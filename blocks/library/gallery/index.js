/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Toolbar, Placeholder } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import './block.scss';
import { registerBlockType, query as hpq } from '../../api';
import MediaUploadButton from '../../media-upload-button';
import InspectorControls from '../../inspector-controls';
import RangeControl from '../../inspector-controls/range-control';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import GalleryImage from './gallery-image';
import BlockDescription from '../../block-description';

const { query, attr } = hpq;

const MAX_COLUMNS = 8;

const editMediaLibrary = ( attributes, setAttributes ) => {
	const frameConfig = {
		frame: 'post',
		title: __( 'Update Gallery media' ),
		button: {
			text: __( 'Select' ),
		},
		multiple: true,
		state: 'gallery-edit',
		selection: new wp.media.model.Selection( attributes.images, { multiple: true } ),
	};

	const editFrame = wp.media( frameConfig );
	function updateFn() {
		setAttributes( {
			images: this.frame.state().attributes.library.models.map( ( a ) => {
				return a.attributes;
			} ),
		} );
	}

	editFrame.on( 'insert', updateFn );
	editFrame.state( 'gallery-edit' ).on( 'update', updateFn );
	editFrame.open( 'gutenberg-gallery' );
};

// the media library image object contains numerous attributes
// we only need this set to display the image in the library
const slimImageObjects = ( imgs ) => {
	const attrSet = [ 'sizes', 'mime', 'type', 'subtype', 'id', 'url', 'alt' ];
	const newImgs = [];
	imgs.forEach( ( img ) => {
		newImgs.push( _.pick( img, attrSet ) );
	} );
	return newImgs;
};

function defaultColumnsNumber( attributes ) {
	attributes.images = attributes.images || [];
	return Math.min( 3, attributes.images.length );
}

registerBlockType( 'core/gallery', {
	title: __( 'Gallery' ),
	icon: 'format-gallery',
	category: 'common',

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, className } ) {
		const { images = [], columns = defaultColumnsNumber( attributes ), align = 'none' } = attributes;
		const setColumnsNumber = ( event ) => setAttributes( { columns: event.target.value } );
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const { imageCrop = true } = attributes;
		const toggleImageCrop = () => setAttributes( { imageCrop: ! imageCrop } );

		const controls = (
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
						controls={ [ 'left', 'center', 'right', 'wide', 'full' ] }
					/>
					{ !! images.length && (
						<Toolbar controls={ [ {
							icon: 'edit',
							title: __( 'Edit Gallery' ),
							onClick: () => editMediaLibrary( attributes, setAttributes ),
						} ] } />
					) }
				</BlockControls>
			)
		);

		if ( images.length === 0 ) {
			const setMediaUrl = ( imgs ) => setAttributes( { images: slimImageObjects( imgs ) } );
			const uploadButtonProps = { isLarge: true };

			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag images here or insert from media library' ) }
					icon="format-gallery"
					label={ __( 'Gallery' ) }
					className={ className }>
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ setMediaUrl }
						type="image"
						autoOpen
						multiple="true"
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
						min="1"
						max={ Math.min( MAX_COLUMNS, images.length ) }
					/>
					<ToggleControl
						label={ __( 'Crop Images' ) }
						checked={ !! imageCrop }
						onChange={ toggleImageCrop }
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
		const { images, columns = defaultColumnsNumber( attributes ), align = 'none', imageCrop = true } = attributes;
		return (
			<div className={ `align${ align } columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }` } >
				{ images.map( ( img ) => (
					<GalleryImage key={ img.url } img={ img } />
				) ) }
			</div>
		);
	},

} );
