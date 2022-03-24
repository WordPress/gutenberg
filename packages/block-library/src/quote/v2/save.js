/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { attribution } = attributes;
	const blockProps = useBlockProps.save();

	const hasAttribution = ! RichText.isEmpty( attribution );
	return hasAttribution ? (
		<figure { ...blockProps }>
			<blockquote>
				<InnerBlocks.Content />
			</blockquote>
			<figcaption>
				<RichText.Content value={ attribution } />
			</figcaption>
		</figure>
	) : (
		<blockquote { ...blockProps }>
			<InnerBlocks.Content />
		</blockquote>
	);
}
