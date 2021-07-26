/**
 * WordPress dependencies
 */
import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import saveWithoutInnerBlocks from './v1/save';

export default function saveWithInnerBlocks( { attributes } ) {
	if ( attributes?.ids?.length > 0 || attributes?.images?.length > 0 ) {
		return saveWithoutInnerBlocks( { attributes } );
	}

	const { caption, columns = 'default', imageCrop } = attributes;

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
