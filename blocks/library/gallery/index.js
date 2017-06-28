/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Toolbar, Placeholder } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query as hpq } from '../../api';
import MediaUploadButton from '../../media-upload-button';
import InspectorControls from '../../inspector-controls';
import RangeControl from '../../inspector-controls/range-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import GalleryImage from './gallery-image';

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

function defaultColumnsNumber( attributes ) {
	attributes.images = attributes.images || [];
	return Math.min( 3, attributes.images.length );
}

registerBlockType( 'core/gallery', {
	title: __( 'Gallery' ),
	icon: 'format-gallery',
	category: 'common',

	attributes: {
		images:
			query( 'div.wp-block-gallery figure.blocks-gallery-image img', {
				url: attr( 'src' ),
				alt: attr( 'alt' ),
			} ) || [],
	},

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
			const setMediaUrl = ( imgs ) => setAttributes( { images: imgs } );
			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag images here or insert from media library' ) }
					icon="format-gallery"
					label={ __( 'Gallery' ) }
					className={ className }>
					<MediaUploadButton
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
					<RangeControl
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ setColumnsNumber }
						min="1"
						max={ Math.min( MAX_COLUMNS, images.length ) }
					/>
				</InspectorControls>
			),
			<div key="gallery" className={ `${ className } align${ align } columns-${ columns }` }>
				{ images.map( ( img ) => (
					<GalleryImage key={ img.url } img={ img } />
				) ) }
			</div>,
		];
	},

	save( { attributes } ) {
		const { images, columns = defaultColumnsNumber( attributes ), align = 'none' } = attributes;
		return (
			<div className={ `align${ align } columns-${ columns }` } >
				{ images.map( ( img ) => (
					<GalleryImage key={ img.url } img={ img } />
				) ) }
			</div>
		);
	},

} );
