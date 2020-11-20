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
			selector: '.blocks-gallery-item',
			query: {
				url: {
					type: 'string',
					source: 'attribute',
					selector: 'img',
					attribute: 'src',
				},
				fullUrl: {
					type: 'string',
					source: 'attribute',
					selector: 'img',
					attribute: 'data-full-url',
				},
				link: {
					type: 'string',
					source: 'attribute',
					selector: 'img',
					attribute: 'data-link',
				},
				alt: {
					type: 'string',
					source: 'attribute',
					selector: 'img',
					attribute: 'alt',
					default: '',
				},
				id: {
					type: 'string',
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
			items: {
				type: 'number',
			},
			default: [],
		},
		columns: {
			type: 'number',
			minimum: 1,
			maximum: 8,
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
		sizeSlug: {
			type: 'string',
			default: 'large',
		},
	},
	supports: {
		align: true,
	},
	isEligible( { linkTo } ) {
		return ! linkTo || linkTo === 'attachment' || linkTo === 'media';
	},
	migrate( attributes ) {
		let linkTo = attributes.linkTo;
		if ( ! attributes.linkTo ) {
			linkTo = 'none';
		} else if ( attributes.linkTo === 'attachment' ) {
			linkTo = 'post';
		} else if ( attributes.linkTo === 'media' ) {
			linkTo = 'file';
		}
		return {
			...attributes,
			linkTo,
		};
	},
	save( { attributes } ) {
		const {
			images,
			columns = defaultColumnsNumber( attributes.images.length ),
			imageCrop,
			caption,
			linkTo,
		} = attributes;

		return (
			<figure
				className={ `columns-${ columns } ${
					imageCrop ? 'is-cropped' : ''
				}` }
			>
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
									{ href ? (
										<a href={ href }>{ img }</a>
									) : (
										img
									) }
									{ ! RichText.isEmpty( image.caption ) && (
										<RichText.Content
											tagName="figcaption"
											className="blocks-gallery-item__caption"
											value={ image.caption }
										/>
									) }
								</figure>
							</li>
						);
					} ) }
				</ul>
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content
						tagName="figcaption"
						className="blocks-gallery-caption"
						value={ caption }
					/>
				) }
			</figure>
		);
	},
};
