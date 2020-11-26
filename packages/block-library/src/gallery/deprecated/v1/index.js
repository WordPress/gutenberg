/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from '../shared';
import { getHrefAndDestination } from '../../utils';

export default {
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
	supports: {
		align: true,
	},
	save( { attributes } ) {
		const {
			images,
			columns = defaultColumnsNumber( attributes ),
			align,
			imageCrop,
			linkTo,
		} = attributes;
		const className = classnames( `columns-${ columns }`, {
			alignnone: align === 'none',
			'is-cropped': imageCrop,
		} );
		return (
			<div className={ className }>
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
						/>
					);

					return (
						<figure
							key={ image.id || image.url }
							className="blocks-gallery-image"
						>
							{ href ? <a href={ href }>{ img }</a> : img }
						</figure>
					);
				} ) }
			</div>
		);
	},
	isEligible( { imageCount } ) {
		return ! imageCount;
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
				allowResize: false,
				isListItem: true,
			},
			imageBlocks,
		];
	},
};
