/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { attribution } = attributes;
	const blockProps = useBlockProps.save();
	const hasAttribution = ! RichText.isEmpty( attribution );
	return (
		<figure { ...blockProps }>
			<blockquote>
				<InnerBlocks.Content />
			</blockquote>
			{ hasAttribution && (
				<figcaption>
					<RichText.Content value={ attribution } />
				</figcaption>
			) }
		</figure>
	);
}
