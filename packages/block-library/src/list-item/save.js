/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export const save = () => (
	<li>
		<InnerBlocks.Content />
	</li>
);
