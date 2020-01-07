/**
 * External dependencies
 */
import classnames from 'classnames';
import { map, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';

const deprecated = [
	{
		attributes: {
			images: {
				type: 'array',
				default: [],
				source: 'query',
				selector: '.blocks-gallery-item',
				query: {
					url: {
						source: 'attribute',
						selector: 'img',
						attribute: 'src',
					},
					fullUrl: {
						source: 'attribute',
						selector: 'img',
						attribute: 'data-full-url',
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
						selector: '.blocks-gallery-item__caption',
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
			caption: {
				type: 'string',
				source: 'html',
				selector: '.blocks-gallery-caption',
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
		isEligible( { ids } ) {
			return ids && ids.some( ( id ) => typeof id === 'string' );
		},
		migrate( attributes ) {
			return {
				...attributes,
				ids: map( attributes.ids, ( id ) => {
					const parsedId = parseInt( id, 10 );
					return Number.isInteger( parsedId ) ? parsedId : null;
				} ),
			};
		},
		save( { attributes } ) {
			const { images, columns = defaultColumnsNumber( attributes ), imageCrop, caption, linkTo } = attributes;

			return (
				<figure className={ `columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }` }>
					<ul className="blocks-gallery-grid">
						{ images.map( ( image ) => {
							let href;

							switch ( linkTo ) {
								case 'media':
									href = image.fullUrl || image.url;
									break;
								case 'attachment':
									href = image.link;
									break;
							}

							const img = (
								<img
									src={ image.url }
									alt={ image.alt }
									data-id={ image.id }
									data-full-url={ image.fullUrl }
									data-link={ image.link }
									className={ image.id ? `wp-image-${ image.id }` : null }
								/>
							);

							return (
								<li key={ image.id || image.url } className="blocks-gallery-item">
									<figure>
										{ href ? <a href={ href }>{ img }</a> : img }
										{ ! RichText.isEmpty( image.caption ) && (
											<RichText.Content tagName="figcaption" className="blocks-gallery-item__caption" value={ image.caption } />
										) }
									</figure>
								</li>
							);
						} ) }
					</ul>
					{ ! RichText.isEmpty( caption ) && <RichText.Content tagName="figcaption" className="blocks-gallery-caption" value={ caption } /> }
				</figure>
			);
		},
	},
	{
		attributes: {
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
					fullUrl: {
						source: 'attribute',
						selector: 'img',
						attribute: 'data-full-url',
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
					link: {
						source: 'attribute',
						selector: 'img',
						attribute: 'data-link',
					},
					caption: {
						type: 'array',
						source: 'children',
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
		},
		save( { attributes } ) {
			const { images, columns = defaultColumnsNumber( attributes ), imageCrop, linkTo } = attributes;
			return (
				<ul className={ `columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }` } >
					{ images.map( ( image ) => {
						let href;

						switch ( linkTo ) {
							case 'media':
								href = image.fullUrl || image.url;
								break;
							case 'attachment':
								href = image.link;
								break;
						}

						const img = (
							<img
								src={ image.url }
								alt={ image.alt }
								data-id={ image.id }
								data-full-url={ image.fullUrl }
								data-link={ image.link }
								className={ image.id ? `wp-image-${ image.id }` : null }
							/>
						);

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
					link: {
						source: 'attribute',
						selector: 'img',
						attribute: 'data-link',
					},
					caption: {
						type: 'array',
						source: 'children',
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
		},
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
		attributes: {
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
						default: '',
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
			align: {
				type: 'string',
				default: 'none',
			},
		},

		save( { attributes } ) {
			const { images, columns = defaultColumnsNumber( attributes ), align, imageCrop, linkTo } = attributes;
			const className = classnames( `columns-${ columns }`, {
				alignnone: align === 'none',
				'is-cropped': imageCrop,
			} );
			return (
				<div className={ className } >
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
];

export default deprecated;
