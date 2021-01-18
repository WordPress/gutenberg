/**
 * WordPress dependencies
 */
import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';

export default function save( { attributes } ) {
	const {
		imageCount,
		columns = defaultColumnsNumber( imageCount ),
		imageCrop,
		caption,
	} = attributes;
	const className = `blocks-gallery-grid has-nested-images columns-${ columns } ${
		imageCrop ? 'is-cropped' : ''
	}`;

	return (
		<figure { ...useBlockProps.save( { className } ) }>
<<<<<<< HEAD
			<ul className="blocks-gallery-grid">
				<InnerBlocks.Content />
			</ul>
=======
			<InnerBlocks.Content />
>>>>>>> f5e1485f1cbc83de9f6998d6fe4ce59b4aa4e826
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
