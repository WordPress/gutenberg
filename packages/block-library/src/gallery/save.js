/**
 * WordPress dependencies
 */
import { RichText, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';

// Need to add work out best way to pass this to child images.
// import {
// 	LINK_DESTINATION_ATTACHMENT,
// 	LINK_DESTINATION_MEDIA,
// } from './constants';

export default function save( { attributes } ) {
	const {
		columns = 3, // defaultColumnsNumber( attributes ),
		imageCrop,
		caption,
		// linkTo, // Needs to be passed down to children.
	} = attributes;

	return (
		<figure
			className={ `columns-${ columns } ${
				imageCrop ? 'is-cropped' : ''
			}` }
		>
			<ul>
				<InnerBlocks.Content />
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
