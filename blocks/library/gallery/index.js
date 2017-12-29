/**
 * External dependencies
 */
import { filter, every } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createMediaFromFile } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType, createBlock } from '../../api';
import { default as GalleryBlock, defaultColumnsNumber } from './block';

registerBlockType( 'core/gallery', {
	title: __( 'Gallery' ),
	description: __( 'Image galleries are a great way to share groups of pictures on your site.' ),
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
			source: 'query',
			selector: 'div.wp-block-gallery figure.blocks-gallery-image img',
			query: {
				url: {
					source: 'attribute',
					attribute: 'src',
				},
				alt: {
					source: 'attribute',
					attribute: 'alt',
				},
				id: {
					source: 'attribute',
					attribute: 'data-id',
				},
			},
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
					const validImages = filter( blockAttributes, ( { id, url } ) => id && url );
					if ( validImages.length > 0 ) {
						return createBlock( 'core/gallery', {
							images: validImages.map( ( { id, url, alt } ) => ( { id, url, alt } ) ),
						} );
					}
					return createBlock( 'core/gallery' );
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
			{
				type: 'files',
				isMatch( files ) {
					return files.length !== 1 && every( files, ( file ) => file.type.indexOf( 'image/' ) === 0 );
				},
				transform( files ) {
					return Promise.all( files.map( ( file ) => createMediaFromFile( file ) ) )
						.then( ( medias ) => createBlock( 'core/gallery', {
							images: medias.map( media => ( {
								id: media.id,
								url: media.source_url,
							} ) ),
						} ) );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( { images } ) => {
					if ( images.length > 0 ) {
						return images.map( ( { id, url, alt } ) => createBlock( 'core/image', { id, url, alt } ) );
					}
					return createBlock( 'core/image' );
				},
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
