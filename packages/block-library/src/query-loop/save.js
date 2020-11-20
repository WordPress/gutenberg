/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function QueryLoopSave() {
	return (
		<li>
			<InnerBlocks.Content />
		</li>
	);
}
