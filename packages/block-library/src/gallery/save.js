/**
 * WordPress dependencies
 */
import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';
import saveV1 from './v1/save';

export default function save( { attributes } ) {
	if ( attributes?.ids?.length > 0 || attributes?.images?.length > 0 ) {
		return saveV1( { attributes } );
	}

	const {
		imageCount,
		caption,
		columns = defaultColumnsNumber( imageCount ),
		imageCrop,
	} = attributes;

	const className = `blocks-gallery-grid has-nested-images columns-${ columns } ${
		imageCrop ? 'is-cropped' : ''
	}`;

	return (
		<figure { ...useBlockProps.save( { className } ) }>
			<InnerBlocks.Content />
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
