/**
 * External dependencies
 */
import { map, some } from 'lodash';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from '../../shared';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default {
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
		return (
			images &&
			images.length > 0 &&
			( ( ! ids && images ) ||
				( ids && images && ids.length !== images.length ) ||
				some( images, ( id, index ) => {
					if ( ! id && ids[ index ] !== null ) {
						return true;
					}
					return parseInt( id, 10 ) !== ids[ index ];
				} ) )
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
	supports: {
		align: true,
	},
	save( { attributes } ) {
		const {
			images,
			columns = defaultColumnsNumber( attributes?.images.length ),
			imageCrop,
			linkTo,
		} = attributes;
		return (
			<ul
				className={ `columns-${ columns } ${
					imageCrop ? 'is-cropped' : ''
				}` }
			>
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

					const img = (
						<img
							src={ image.url }
							alt={ image.alt }
							data-id={ image.id }
							data-link={ image.link }
							className={
								image.id ? `wp-image-${ image.id }` : null
							}
						/>
					);

					return (
						<li
							key={ image.id || image.url }
							className="blocks-gallery-item"
						>
							<figure>
								{ href ? <a href={ href }>{ img }</a> : img }
								{ image.caption && image.caption.length > 0 && (
									<RichText.Content
										tagName="figcaption"
										value={ image.caption }
									/>
								) }
							</figure>
						</li>
					);
				} ) }
			</ul>
		);
	},
};
