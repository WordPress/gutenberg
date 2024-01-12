/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save() {
	return (
		<nav { ...useBlockProps.save() }>
			<InnerBlocks.Content />
		</nav>
	);
}
