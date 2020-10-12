/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save() {
	return (
		<ul { ...useBlockProps.save() }>
			<InnerBlocks.Content />
		</ul>
	);
}
