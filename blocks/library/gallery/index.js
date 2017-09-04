/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType, source } from '../../api';
import GalleryImage from './gallery-image';
import { default as GalleryBlock, defaultColumnsNumber } from './block';

const { query, attr } = source;

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

	edit: GalleryBlock,

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
