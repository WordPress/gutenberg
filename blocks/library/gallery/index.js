/**
 * Internal dependencies
 */
import { __ } from 'i18n';
import './style.scss';
import { registerBlockType, query as hpq } from '../../api';

import Placeholder from 'components/placeholder';
import MediaUploadButton from '../../media-upload-button';
import InspectorControls from '../../inspector-controls';

import GalleryImage from './gallery-image';

const { query, attr } = hpq;

const editMediaLibrary = ( attributes, setAttributes ) => {
	const frameConfig = {
		frame: 'post',
		title: wp.i18n.__( 'Update Gallery media' ),
		button: {
			text: wp.i18n.__( 'Select' ),
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

/**
 * Returns an attribute setter with behavior that if the target value is
 * already the assigned attribute value, it will be set to undefined.
 *
 * @param  {string}   align Alignment value
 * @return {Function}       Attribute setter
 */
function toggleAlignment( align ) {
	return ( attributes, setAttributes ) => {
		const nextAlign = attributes.align === align ? undefined : align;
		setAttributes( { align: nextAlign } );
	};
}

registerBlockType( 'core/gallery', {
	title: wp.i18n.__( 'Gallery' ),
	icon: 'format-gallery',
	category: 'common',

	attributes: {
		images:
			query( 'div.blocks-gallery figure.blocks-gallery-image img', {
				url: attr( 'src' ),
				alt: attr( 'alt' ),
			} ),
	},

	controls: [
		{
			icon: 'align-left',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: toggleAlignment( 'left' ),
		},
		{
			icon: 'align-center',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => ! align || 'center' === align,
			onClick: toggleAlignment( 'center' ),
		},
		{
			icon: 'align-right',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick: toggleAlignment( 'right' ),
		},
		{
			icon: 'align-wide',
			title: __( 'Wide width' ),
			isActive: ( { align } ) => 'wide' === align,
			onClick: toggleAlignment( 'wide' ),
		},
		{
			icon: 'align-full-width',
			title: __( 'Full width' ),
			isActive: ( { align } ) => 'full' === align,
			onClick: toggleAlignment( 'full' ),
		},
		{
			icon: 'format-image',
			title: wp.i18n.__( 'Edit Gallery' ),
			onClick: editMediaLibrary,
		},
	],

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus } ) {
		let { images, columns, align = 'none' } = attributes;
		const setColumnsNumber = ( event ) => { setAttributes( { columns: event.target.value } ); };
		if ( ! images ) {
			const setMediaUrl = ( imgs ) => setAttributes( { images: imgs } );
			return (
				<Placeholder
					instructions={ wp.i18n.__( 'Drag images here or insert from media library' ) }
					icon="format-gallery"
					label={ wp.i18n.__( 'Gallery' ) }
					className="blocks-gallery">
					<MediaUploadButton
						onSelect={ setMediaUrl }
						type="image"
						auto-open
						multiple="true"
					>
						{ wp.i18n.__( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>
			);
		}
		if ( !columns ) {
			columns = Math.min( 3, images.length );
		}

		return (
			<div className={ `blocks-gallery align${ align } columns-${ columns }` }>
				{ images.map( ( img, i ) => (
					<GalleryImage key={ i } img={ img } />
				) ) }
				{ focus && images.length > 1 &&
					<InspectorControls>
						<label>Columns:</label>
						<input type="range" min="1" max={ images.length } value={ columns } onChange={ setColumnsNumber } />
						<span>{columns}</span>
					</InspectorControls> }
			</div>
		);
	},

	save( { attributes } ) {
		const { images, align = 'none' } = attributes;

		return (
			<div className={ `blocks-gallery align${ align }` } >
				{ images.map( ( img, i ) => (
					<GalleryImage key={ i } img={ img } />
				) ) }
			</div>
		);
	},

} );
