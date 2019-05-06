/**
 * External dependencies
 */
import { map, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import { defaultColumnsNumber } from './shared';

const { name, attributes: blockAttributes } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Gallery' ),
	description: __( 'Display multiple images in a rich gallery.' ),
	icon,
	keywords: [ __( 'images' ), __( 'photos' ) ],
	supports: {
		align: true,
	},
	transforms,
	edit,
	save,
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
