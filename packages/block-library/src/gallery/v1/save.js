/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { defaultColumnsNumberV1 } from '../deprecated';
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
} from '../constants';

export default function saveV1( { attributes } ) {
	const {
		images,
		columns = defaultColumnsNumberV1( attributes ),
		imageCrop,
		caption,
		linkTo,
	} = attributes;
	const className = `columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }`;

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
