/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	/**
	 * Render the list item only if there is content.
	 * This check is to eliminate empty list items from the front end.
	 */
	if ( attributes.content?.length === 0 ) {
		return null;
	}

	return (
		<li { ...useBlockProps.save() }>
			<RichText.Content value={ attributes.content } />
			<InnerBlocks.Content />
		</li>
	);
}
