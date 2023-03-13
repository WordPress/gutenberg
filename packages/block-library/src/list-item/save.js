/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<li { ...useBlockProps.save() }>
			<RichText.Content value={ attributes.content } />
			<InnerBlocks.Content />
		</li>
	);
}
