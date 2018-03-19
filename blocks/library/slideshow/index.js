/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal depedencies
 */
import './editor.scss';
import SlideshowBlock from './block';

export const name = 'core/slideshow';

export const settings = {
	title: __( 'Slideshow' ),

	// TODO: Add a proper description
	description: __( 'Take your images and, like, slide em!' ),

	icon: 'slideshow',

	category: 'common',

	// TODO: Add keywords?
	// keywords: [ __( 'images' ), __( 'photos' ) ],

	attributes: {
		images: {
			type: 'array',
			default: [],
			source: 'query',
			selector: 'ul.wp-block-slideshow .blocks-slideshow-item',
			query: {
				url: {
					source: 'attribute',
					selector: 'img',
					attribute: 'src',
				},
				id: {
					source: 'attribute',
					selector: 'img',
					attribute: 'data-id',
				},
				alt: {
					source: 'attribute',
					selector: 'img',
					attribute: 'alt',
					default: '',
				},
				caption: {
					type: 'array',
					source: 'children',
					selector: 'figcaption',
				},
				link: {
					source: 'attribute',
					selector: 'img',
					attribute: 'data-link',
				},
			},
		},
		align: {
			type: 'string',
		},
		duration: {
			type: 'number',
			default: 0,
		},
		pagination: {
			type: 'string',
			default: 'dot',
		},
		showArrows: {
			type: 'boolean',
			default: true,
		},
		showTitles: {
			type: 'boolean',
			default: true,
		},
		showCaptions: {
			type: 'boolean',
			default: true,
		},
		linkTo: {
			type: 'string',
			default: 'none',
		},
	},

	transforms: {
		// TODO: Borrow some transforms from the gallery block
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: SlideshowBlock,

	save( { attributes } ) {
		const { images, linkTo } = attributes;

		return (
			<ul>
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

					let img = <img src={ image.url } alt={ image.alt } data-id={ image.id } data-link={ image.link } />;

					if ( href ) {
						img = <a href={ href }>{ img }</a>;
					}

					return (
						<li key={ image.id || image.url } className="blocks-slideshow-item">
							<figure>
								{ img }
								{ ! isEmpty( image.caption ) && <figcaption>{ image.caption }</figcaption> }
							</figure>
						</li>
					);
				} ) }
			</ul>
		);
	},
};
