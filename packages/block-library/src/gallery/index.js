/**
 * External dependencies
 */
import { filter, every, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { RichText, mediaUpload } from '@wordpress/editor';
import { createBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { default as edit, defaultColumnsNumber, RELEVANT_MEDIA_FIELDS } from './edit';

const blockAttributes = {
	images: {
		type: 'array',
		default: [],
		source: 'query',
		selector: 'ul.wp-block-gallery .blocks-gallery-item',
		query: {
			url: {
				source: 'attribute',
				selector: 'img',
				attribute: 'src',
			},
			link: {
				source: 'attribute',
				selector: 'img',
				attribute: 'data-link',
			},
			alt: {
				source: 'attribute',
				selector: 'img',
				attribute: 'alt',
				default: '',
			},
			id: {
				source: 'attribute',
				selector: 'img',
				attribute: 'data-id',
			},
			caption: {
				source: 'rich-text',
				selector: 'figcaption',
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
};

export const name = 'core/gallery';

export const settings = {
	title: __( 'Gallery' ),
	description: __( 'Display multiple images in an elegantly organized tiled layout.' ),
	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><g><path d="M20 4v12H8V4h12m0-2H8L6 4v12l2 2h12l2-2V4l-2-2z" /><path d="M12 12l1 2 3-3 3 4H9z" /><path d="M2 6v14l2 2h14v-2H4V6H2z" /></g></svg>,
	category: 'common',
	keywords: [ __( 'images' ), __( 'photos' ) ],
	attributes: blockAttributes,
	supports: {
		align: true,
	},

	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ 'core/image' ],
				transform: ( attributes ) => {
					const validImages = filter( attributes, ( { id, url } ) => id && url );
					if ( validImages.length > 0 ) {
						return createBlock( 'core/gallery', {
							images: validImages.map( ( { id, url, alt, caption } ) => ( { id, url, alt, caption } ) ),
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
				// When created by drag and dropping multiple files on an insertion point
				type: 'files',
				isMatch( files ) {
					return files.length !== 1 && every( files, ( file ) => file.type.indexOf( 'image/' ) === 0 );
				},
				transform( files, onChange ) {
					const block = createBlock( 'core/gallery', {
						images: files.map( ( file ) => ( { url: createBlobURL( file ) } ) ),
					} );
					mediaUpload( {
						filesList: files,
						onFileChange: ( images ) => onChange( block.clientId, {
							images: images.map( ( image ) => pick( image, RELEVANT_MEDIA_FIELDS ) ),
						} ),
						allowedTypes: [ 'image' ],
					} );
					return block;
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( { images } ) => {
					if ( images.length > 0 ) {
						return images.map( ( { id, url, alt, caption } ) => createBlock( 'core/image', { id, url, alt, caption } ) );
					}
					return createBlock( 'core/image' );
				},
			},
		],
	},

	edit,

	save( { attributes } ) {
		const { images, columns = defaultColumnsNumber( attributes ), imageCrop, linkTo } = attributes;
		return (
			<ul className={ `columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }` } >
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

					const img = <img src={ image.url } alt={ image.alt } data-id={ image.id } data-link={ image.link } className={ image.id ? `wp-image-${ image.id }` : null } />;

					return (
						<li key={ image.id || image.url } className="blocks-gallery-item">
							<figure>
								{ href ? <a href={ href }>{ img }</a> : img }
								{ image.caption && image.caption.length > 0 && (
									<RichText.Content tagName="figcaption" value={ image.caption } />
								) }
							</figure>
						</li>
					);
				} ) }
			</ul>
		);
	},

	deprecated: [
		{
			attributes: blockAttributes,
			save( { attributes } ) {
				const { images, columns = defaultColumnsNumber( attributes ), imageCrop, linkTo } = attributes;
				return (
					<ul className={ `columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }` } >
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

							const img = <img src={ image.url } alt={ image.alt } data-id={ image.id } data-link={ image.link } />;

							return (
								<li key={ image.id || image.url } className="blocks-gallery-item">
									<figure>
										{ href ? <a href={ href }>{ img }</a> : img }
										{ image.caption && image.caption.length > 0 && (
											<RichText.Content tagName="figcaption" value={ image.caption } />
										) }
									</figure>
								</li>
							);
						} ) }
					</ul>
				);
			},
		},
		{
			attributes: {
				...blockAttributes,
				images: {
					...blockAttributes.images,
					selector: 'div.wp-block-gallery figure.blocks-gallery-image img',
				},
				align: {
					type: 'string',
					default: 'none',
				},
			},

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
		},
	],
};
