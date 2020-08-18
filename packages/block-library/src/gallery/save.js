/**
 * WordPress dependencies
 */
import { RichText, InnerBlocks } from '@wordpress/block-editor';

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
			<ul>
				<InnerBlocks.Content
					__experimentalItemCallback={ ( item ) => (
						<>
							<li class="wp-block-gallery__image">{ item }</li>
						</>
					) }
				/>
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
