/**
 * External dependencies
 */
import { filter, every, map, some } from 'lodash';

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
import { default as edit, defaultColumnsNumber, pickRelevantMediaFiles } from './edit';
import icon from './icon';

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
				type: 'string',
				source: 'html',
				selector: 'figcaption',
			},
		},
	},
	ids: {
		type: 'array',
		default: [],
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

const parseShortcodeIds = ( ids ) => {
	if ( ! ids ) {
		return [];
	}

	return ids.split( ',' ).map( ( id ) => (
		parseInt( id, 10 )
	) );
};

export const settings = {
	title: __( 'Gallery' ),
	description: __( 'Display multiple images in a rich gallery.' ),
	icon,
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
					// Init the align attribute from the first item which may be either the placeholder or an image.
					let { align } = attributes[ 0 ];
					// Loop through all the images and check if they have the same align.
					align = every( attributes, [ 'align', align ] ) ? align : undefined;

					const validImages = filter( attributes, ( { id, url } ) => id && url );

					return createBlock( 'core/gallery', {
						images: validImages.map( ( { id, url, alt, caption } ) => ( { id, url, alt, caption } ) ),
						ids: validImages.map( ( { id } ) => id ),
						align,
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
							return parseShortcodeIds( ids ).map( ( id ) => ( {
								id,
							} ) );
						},
					},
					ids: {
						type: 'array',
						shortcode: ( { named: { ids } } ) => {
							return parseShortcodeIds( ids );
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
						images: files.map( ( file ) => pickRelevantMediaFiles( {
							url: createBlobURL( file ),
						} ) ),
					} );
					mediaUpload( {
						filesList: files,
						onFileChange: ( images ) => {
							const imagesAttr = images.map(
								pickRelevantMediaFiles
							);
							onChange( block.clientId, {
								ids: map( imagesAttr, 'id' ),
								images: imagesAttr,
							} );
						},
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
				transform: ( { images, align } ) => {
					if ( images.length > 0 ) {
						return images.map( ( { id, url, alt, caption } ) => createBlock( 'core/image', { id, url, alt, caption, align } ) );
					}
					return createBlock( 'core/image', { align } );
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
			isEligible( { images, ids } ) {
				return images &&
					images.length > 0 &&
					(
						( ! ids && images ) ||
						( ids && images && ids.length !== images.length ) ||
						some( images, ( id, index ) => {
							if ( ! id && ids[ index ] !== null ) {
								return true;
							}
							return parseInt( id, 10 ) !== ids[ index ];
						} )
					);
			},
			migrate( attributes ) {
				return {
					...attributes,
					ids: map( attributes.images, ( { id } ) => {
						if ( ! id ) {
							return null;
						}
						return parseInt( id, 10 );
					} ),
				};
			},
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
		},
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
