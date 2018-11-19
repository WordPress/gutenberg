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
import { G, Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { default as edit, defaultColumnsNumber, pickRelevantMediaFiles } from './edit';

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
	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path fill="none" d="M0 0h24v24H0V0z" /><G><Path d="M20 4v12H8V4h12m0-2H8L6 4v12l2 2h12l2-2V4l-2-2z" /><Path d="M12 12l1 2 3-3 3 4H9z" /><Path d="M2 6v14l2 2h14v-2H4V6H2z" /></G></SVG>,
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
							ids: validImages.map( ( { id } ) => id ),
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
