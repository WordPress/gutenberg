/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';

export default function save( { attributes } ) {
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
}
