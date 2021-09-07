/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<>
			<RichText.Content
				tagName="h2"
				className="widget-title"
				value={ attributes.title }
			/>
			<InnerBlocks.Content />
		</>
	);
}
