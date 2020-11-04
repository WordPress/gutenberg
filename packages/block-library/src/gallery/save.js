/**
 * WordPress dependencies
 */
import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { columns, imageCrop, caption } = attributes;
	const className = `columns-${ columns } ${ imageCrop ? 'is-cropped' : '' }`;

	return (
		<figure { ...useBlockProps.save( { className } ) }>
			<ul className="blocks-gallery-grid">
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
