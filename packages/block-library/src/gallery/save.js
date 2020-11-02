/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __unstableStripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
} from './constants';

export default function save( { attributes } ) {
	const {
		images,
		columns = defaultColumnsNumber( attributes ),
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
						case LINK_DESTINATION_MEDIA:
							href = image.fullUrl || image.url;
							break;
						case LINK_DESTINATION_ATTACHMENT:
							href = image.link;
							break;
					}

					// image.caption comes from a RichText component, so it can contain
					// HTML that we need to strip. In GB 9.2, image.alt would fall back to
					// image.caption without stripping the HTML, so we also run it through
					// __unstableStripHTML here.
					let alt = image.alt || image.caption;

					if ( alt && alt !== __unstableStripHTML( alt ) ) {
						alt = __unstableStripHTML( alt );
					}

					const img = (
						<img
							src={ image.url }
							alt={ alt }
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
								{ href ? <a href={ href }>{ img }</a> : img }
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
}
