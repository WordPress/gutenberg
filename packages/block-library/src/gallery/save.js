/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';

export default function save( { attributes } ) {
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
}
