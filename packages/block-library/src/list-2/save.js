/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
} from '@wordpress/block-editor';

export default function Save() {
	return (
		<ol>
			<InnerBlocks.Content />
		</ol>
	);
}
