/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType, source, createBlock } from '../../api';
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

	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ 'core/image' ],
				transform: ( blockAttributes ) => {
					return createBlock( 'core/gallery', {
						images: blockAttributes.map( ( { id, url, alt } ) => ( { id, url, alt } ) ),
					} );
				},
			},
			{
				type: 'shortcode',
				tag: 'gallery',
				attributes: {
					images: {
						type: 'array',
						shortcode: ( { named: { ids } } ) => {
							if ( ! ids ) {
								return [];
							}

							return ids.split( ',' ).map( ( id ) => ( {
								id: parseInt( id, 10 ),
							} ) );
						},
					},
					columns: {
						type: 'number',
						shortcode: ( { named: { columns = '3' } } ) => {
							return parseInt( columns, 10 );
						},
					},
					linkTo: {
						type: 'string',
						shortcode: ( { named: { link = 'attachment' } } ) => {
							return link === 'file' ? 'media' : link;
						},
					},
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( { images } ) => (
					images.map( ( { id, url, alt } ) => createBlock( 'core/image', { id, url, alt } ) )
				),
			},
		],
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
				{ images.map( ( image ) => {
					let href;

					switch ( linkTo ) {
						case 'media':
							href = image.url;
							break;
						case 'attachment':
							href = image.link;
							break;
					}

					const img = <img src={ image.url } alt={ image.alt } data-id={ image.id } />;

					return (
						<figure key={ image.id || image.url } className="blocks-gallery-image">
							{ href ? <a href={ href }>{ img }</a> : img }
						</figure>
					);
				} ) }
			</div>
		);
	},

} );
