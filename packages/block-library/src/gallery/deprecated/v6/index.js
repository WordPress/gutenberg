/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from '../../shared';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
} from '../../constants';
import { getHrefAndDestination } from '../../utils';

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
		},
		sizeSlug: {
			type: 'string',
			default: 'large',
		},
	},
	supports: {
		anchor: true,
		align: true,
	},
	save( { attributes } ) {
		const {
			images,
			columns = defaultColumnsNumber( attributes?.images.length ),
			imageCrop,
			caption,
			linkTo,
		} = attributes;
		const className = `columns-${ columns } ${
			imageCrop ? 'is-cropped' : ''
		}`;

		return (
			<figure { ...useBlockProps.save( { className } ) }>
				<ul className="blocks-gallery-grid">
					{ images.map( ( image ) => {
						let href;

						switch ( linkTo ) {
							case LINK_DESTINATION_MEDIA:
								href = image.fullUrl || image.url;
								break;
							case LINK_DESTINATION_ATTACHMENT:
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
	isEligible( { ids } ) {
		return !! ids;
	},
	migrate( { images, imageCrop, linkTo, sizeSlug, columns, caption } ) {
		const imageBlocks = images.map( ( image ) => {
			return createBlock( 'core/image', {
				id: parseInt( image.id ),
				url: image.url,
				alt: image.alt,
				caption: image.caption,
				sizeSlug,
				...getHrefAndDestination( image, linkTo ),
			} );
		} );
		return [
			{
				caption,
				columns,
				imageCrop,
				linkTo,
				sizeSlug,
				imageCount: imageBlocks.length,
				isListItem: true,
			},
			imageBlocks,
		];
	},
};
