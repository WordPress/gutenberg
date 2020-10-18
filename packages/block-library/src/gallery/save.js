/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
// import { defaultColumnsNumber } from './shared';

// Need to add work out best way to pass this to child images.
// import {
// 	LINK_DESTINATION_ATTACHMENT,
// 	LINK_DESTINATION_MEDIA,
// } from './constants';

export default function save( { attributes } ) {
	const {
		columns = 3, // defaultColumnsNumber( attributes ) - TODO: get this somehow from Edit state?
		imageCrop,
		caption,
		// linkTo, // Needs to be passed down to children.
	} = attributes;

	return (
		<figure
			className={ classnames( `columns-${ columns }`, {
				'is-cropped': imageCrop,
			} ) }
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
