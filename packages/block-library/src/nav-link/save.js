/**
 * WordPress dependencies
 */
import { RichText, InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes: { url, label } } ) {
	return (
		<div>
			<RichText.Content
				tagName="a"
				className="wp-block-nav-link__link"
				href={ url }
				value={ label }
			/>
			<InnerBlocks.Content />
		</div>
	);
}
